// Deno Edge Function: POS Batch Offline Synchronization
// Handles receiving local cart checkouts, updating product stock, and returning status.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { tenantId, orders } = await req.json();

    if (!tenantId || !orders || !Array.isArray(orders)) {
      return new Response(
        JSON.stringify({ error: "Invalid payload parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing POS synchronization sync queue for tenant ${tenantId}. Total orders: ${orders.length}`);

    // Process orders batch (Simulated Transaction)
    const processedIds: string[] = [];
    const stockUpdates: Record<string, number> = {};

    for (const order of orders) {
      console.log(`Processing order ${order.id}. Payment: ${order.paymentMethod}. Total: $${order.total}`);
      
      for (const item of order.items) {
        if (!stockUpdates[item.productId]) {
          stockUpdates[item.productId] = 0;
        }
        stockUpdates[item.productId] += item.quantity;
      }
      processedIds.push(order.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sincronización POS completada. ${orders.length} órdenes procesadas.`,
        syncedOrderIds: processedIds,
        inventoryUpdates: stockUpdates
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});