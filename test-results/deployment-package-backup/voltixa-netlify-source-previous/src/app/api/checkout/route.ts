import { NextResponse } from "next/server";
import { checkoutSchema } from "@/lib/validation";
import { products } from "@/lib/data";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function fail(error: string, status: number, issues?: unknown) {
  return NextResponse.json({ error, issues }, { status });
}

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

export async function POST(request: Request) {
  if (!sameOrigin(request))
    return fail("This checkout request was blocked.", 403);

  const supabase = await createClient();
  if (!supabase) return fail("Checkout is not configured.", 503);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return fail("Please sign in to place your order.", 401);
  }

  const parsed = checkoutSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return fail(
      "Please correct the highlighted checkout details.",
      400,
      parsed.error.flatten().fieldErrors,
    );
  }

  const input = parsed.data;
  const admin = createAdminClient();

  try {
    const { data: existingOrder, error: existingError } = await admin
      .from("orders")
      .select("id,order_number,grand_total,status,payment_status")
      .eq("customer_id", user.id)
      .eq("idempotency_key", input.idempotencyKey)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existingOrder) {
      return NextResponse.json({
        orderId: existingOrder.id,
        orderNumber: existingOrder.order_number,
        total: Number(existingOrder.grand_total),
        status: existingOrder.status,
        paymentStatus: existingOrder.payment_status,
        mode: "live",
        duplicate: true,
      });
    }

    const requested = input.items.map((item) => {
      const product = products.find((candidate) =>
        candidate.variants.some((variant) => variant.id === item.variantId),
      );
      const catalogVariant = product?.variants.find(
        (variant) => variant.id === item.variantId,
      );
      if (!product || !catalogVariant) {
        throw new Error("A cart item is no longer available.");
      }
      return { ...item, product, catalogVariant };
    });

    const productSlugs = [
      ...new Set(requested.map((item) => item.product.slug)),
    ];
    const { data: databaseProducts, error: productError } = await admin
      .from("products")
      .select(
        "id,slug,name,status,product_variants(id,sku,name,price,is_active,inventory(quantity,reserved_quantity))",
      )
      .in("slug", productSlugs)
      .eq("status", "published");
    if (productError) throw productError;

    const cartItems = requested.map((item) => {
      const databaseProduct = databaseProducts?.find(
        (candidate) => candidate.slug === item.product.slug,
      );
      const databaseVariant = databaseProduct?.product_variants?.find(
        (variant) => variant.is_active,
      );
      if (!databaseProduct || !databaseVariant) {
        throw new Error(`${item.product.name} is not available for checkout.`);
      }
      const inventory = Array.isArray(databaseVariant.inventory)
        ? databaseVariant.inventory[0]
        : databaseVariant.inventory;
      const available =
        Number(inventory?.quantity ?? 0) -
        Number(inventory?.reserved_quantity ?? 0);
      if (available < item.quantity) {
        throw new Error(
          `${item.product.name} has only ${Math.max(0, available)} units available.`,
        );
      }
      return {
        variant_id: databaseVariant.id,
        quantity: item.quantity,
        gift_wrap: false,
      };
    });

    let cartId: string;
    const { data: activeCart, error: cartLookupError } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();
    if (cartLookupError) throw cartLookupError;

    if (activeCart) {
      cartId = activeCart.id;
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("cart_id", cartId);
      if (error) throw error;
    } else {
      const { data: cart, error } = await supabase
        .from("carts")
        .insert({ user_id: user.id, status: "active" })
        .select("id")
        .single();
      if (error) throw error;
      cartId = cart.id;
    }

    const { error: cartItemError } = await supabase
      .from("cart_items")
      .insert(cartItems.map((item) => ({ ...item, cart_id: cartId })));
    if (cartItemError) throw cartItemError;

    const address = {
      full_name: input.fullName,
      email: input.email,
      phone: input.phone,
      province: input.province,
      city: input.city,
      area: input.area,
      address_line: input.address,
      postal_code: input.postalCode || null,
    };
    const { data: order, error: checkoutError } = await supabase.rpc(
      "checkout_atomic",
      {
        p_cart_id: cartId,
        p_address: address,
        p_payment_method: input.payment,
        p_idempotency_key: input.idempotencyKey,
      },
    );
    if (checkoutError) throw checkoutError;
    if (!order)
      throw new Error("Order creation did not return a confirmation.");

    return NextResponse.json(
      {
        orderId: order.id,
        orderNumber: order.order_number,
        total: Number(order.grand_total),
        status: order.status,
        paymentStatus: order.payment_status,
        mode: "live",
        duplicate: false,
      },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Checkout could not be completed.";
    if (
      message.includes("insufficient_stock") ||
      message.includes("units available")
    ) {
      return fail(
        "An item is no longer available in the requested quantity.",
        409,
      );
    }
    if (message.includes("authentication_required")) {
      return fail("Please sign in to place your order.", 401);
    }
    if (message.includes("empty_cart")) {
      return fail("Your cart is empty.", 400);
    }
    return fail(message, 500);
  }
}
