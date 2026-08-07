import { SiteHeader } from "@/components/site-header";
import { isAdmin } from "@/lib/auth/admin";
import { getCurrentUser } from "@/lib/auth/session";
import { getHomeStats, getNavCategories } from "@/lib/home";
import { getBalance } from "@/lib/wallet/ledger";

export async function Header() {
  const user = await getCurrentUser();
  const [stats, nav, balance] = await Promise.all([
    getHomeStats(),
    getNavCategories(),
    user ? getBalance(user.id) : Promise.resolve(null),
  ]);

  return (
    <SiteHeader
      stats={stats}
      nav={nav}
      user={
        user
          ? {
              email: user.email,
              hasSteam: !!user.steamId64,
              steamNickname: user.steamNickname,
              steamAvatar: user.steamAvatar,
            }
          : null
      }
      balance={balance != null ? Number(balance) : null}
      isAdmin={isAdmin(user)}
    />
  );
}
