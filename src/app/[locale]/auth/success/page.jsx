'use client'
import { useEffect } from "react";

import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { LoginSuccessAnimation } from "../page";


export default function SuccessPage() {
    const t = useTranslations('Auth');

    const searchParams = useSearchParams();
    const router = useRouter();
    const redirectUrl = searchParams?.get('redirect') || '/explore';
    const { user: me, setCurrentUser, refetchUser, updateTokens } = useAuth();
    const accessTokenFromUrl = searchParams?.get('accessToken');
    const refreshTokenFromUrl = searchParams?.get('refreshToken');
    // OAuth: if query has tokens, store them and fetch /auth/me
    useEffect(() => {
        const run = async () => {
            if (!accessTokenFromUrl || !refreshTokenFromUrl) {
                router.push('/auth');
            }
            try {

                updateTokens({ accessToken: accessTokenFromUrl, refreshToken: refreshTokenFromUrl });
                const fatchedUser = await refetchUser();

                //set login data at cookie
                await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ accessToken: accessTokenFromUrl, refreshToken: refreshTokenFromUrl, user: fatchedUser }),
                });

                setTimeout(() => {
                    console.log(fatchedUser)
                    // setShowSuccessAnimation(false);
                    if (fatchedUser.role === 'seller') {
                        router.push('/jobs');
                    } else {
                        router.push(redirectUrl);
                    }
                }, 1000);


            } catch (e) {
                console.error('OAuth finalize failed', e);
                toast.error(t('errors.failedToCompleteLogin'));
            }
        };
        run();
    }, [accessTokenFromUrl, refreshTokenFromUrl, router, redirectUrl]);

    return (
        <div>
            <LoginSuccessAnimation rapid />
        </div>
    );
}