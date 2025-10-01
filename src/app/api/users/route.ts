import { NextRequest, NextResponse} from 'next/server';

export async function GET(request: NextRequest) {
  const users = [
    { id: 1, name: 'Shradhesh' },
  ];
  return NextResponse.json(users, { status: 200 });
}
 
export async function POST(request: NextRequest) {
  const { name } = await request.json();

  const newUser = { id: Date.now(), name };
 
  return NextResponse.json(newUser, { status: 201 });
}