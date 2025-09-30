import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return new NextResponse('Missing fields', { status: 400 });
        }

        const existingUser = await db.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return new NextResponse('User already exists', { status: 409 });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await db.user.create({
            data: {
                email,
                hashedPassword,
            },
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error('[REGISTER_ERROR]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
