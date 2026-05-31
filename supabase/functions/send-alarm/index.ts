import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const FCM_SERVER_KEY = Deno.env.get('FCM_SERVER_KEY'); // Requires the Legacy Server Key or v1 OAuth token

serve(async (req) => {
  try {
    const { record } = await req.json(); // Triggered by a webhook when a new emergency message is inserted

    if (record.type !== 'emergency') {
      return new Response(JSON.stringify({ message: 'Not an emergency, skipping.' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 1. Initialize Supabase Client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 2. Fetch the Child's FCM Push Token
    const { data: profileData, error: profileError } = await supabaseClient
      .from('push_tokens')
      .select('token')
      .eq('role', 'child')
      .single();

    if (profileError || !profileData?.token) {
      throw new Error('Child push token not found');
    }

    const pushToken = profileData.token;

    // 3. Send High-Priority Data Payload via Firebase HTTP API
    const fcmPayload = {
      to: pushToken,
      priority: 'high', // CRITICAL: This is what bypasses Android Doze / Battery Saver
      data: {
        type: 'emergency',
        message: record.text,
        timestamp: new Date().toISOString()
      }
    };

    const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${FCM_SERVER_KEY}`,
      },
      body: JSON.stringify(fcmPayload),
    });

    const fcmResult = await fcmResponse.json();

    return new Response(JSON.stringify({ success: true, fcmResult }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
