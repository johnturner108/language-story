'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

export default function Auth() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isRegistering) {
            // Registration logic
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (res.ok) {
                // Automatically sign in after registration
                signIn('credentials', {
                    email,
                    password,
                    redirect: false,
                }).then((callback) => {
                    if (callback?.ok) {
                        router.refresh();
                    }
                    if (callback?.error) {
                        alert(callback.error);
                    }
                });
            } else {
                alert('Registration failed');
            }
        } else {
            // Login logic
            signIn('credentials', {
                email,
                password,
                redirect: false,
            }).then((callback) => {
                if (callback?.ok) {
                    router.refresh();
                }
                if (callback?.error) {
                    alert(callback.error);
                }
            });
        }
    };

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    required
                />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                />
                <button type="submit">{isRegistering ? 'Register' : 'Login'}</button>
            </form>
            <button onClick={() => setIsRegistering(!isRegistering)}>
                {isRegistering ? 'Already have an account? Login' : "Don't have an account? Register"}
            </button>
        </div>
    );
}
