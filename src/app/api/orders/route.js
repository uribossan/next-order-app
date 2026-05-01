import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase.from('orders').select('*, item:items(*)').order('id', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request) {
  const body = await request.json();
  const { data, error } = await supabase.from('orders').insert([{
    itemId: body.itemId,
    quantity: body.quantity,
    status: body.status,
    supplier: body.supplier
  }]).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data[0]);
}

export async function PUT(request) {
  const body = await request.json();
  const { id, status } = body;
  
  const updateData = { status };
  if (status === '納品済') {
    updateData.deliveredAt = new Date().toISOString();
  }
  
  const { data, error } = await supabase.from('orders').update(updateData).eq('id', id).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data[0]);
}
