import { LandingContent } from '~/components/landing/landing-content';
import { createClient } from '~/utils/supabase/server';
import { getTopPostsWithUserInfo } from '~/server/db/queries/posts';
import { getTopApprovedProjects } from '~/server/db/queries/projects';
import { getUserPoints, getLevelByPoints } from '~/server/db/queries/user';
import { updateProfile } from '~/server/actions/auth';
import type { AccountData } from '~/types/profiles';
import { revalidatePath } from 'next/cache';

export default async function HomePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const isAdmin = user?.user_metadata?.memberType === 'admin';
  const userId = user?.id || null;

  if (userId) {
    const userPoints = await getUserPoints(userId);
    const userLevel = getLevelByPoints(userPoints);
    
    const currentFlowerProfile = user?.user_metadata?.flowerProfile;
    
    if (currentFlowerProfile) {
      const flowerMatch = currentFlowerProfile.match(/\/flowers\/(\d+)\//);
      const flowerNumber = flowerMatch ? flowerMatch[1] : '1';
      
      const currentLevelMatch = currentFlowerProfile.match(/lvl(\d+)\.png/);
      const currentLevel = currentLevelMatch ? parseInt(currentLevelMatch[1]) : 1;
      
      if (userLevel > currentLevel) {
        const newFlowerProfile = `/flowers/${flowerNumber}/lvl${userLevel}.png`;
        
        await updateProfile({
          flowerProfile: newFlowerProfile
        } as Partial<AccountData>);

        revalidatePath('/?levelUp=true');
      }
    }
  }

  const topPosts = await getTopPostsWithUserInfo(3);
  const topProjects = await getTopApprovedProjects(3);

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            if (window.location.search.includes('levelUp=true')) {
              window.history.replaceState({}, '', '/');
              if (typeof window.toast !== 'undefined') {
                window.toast.success('Hooray! Your flower has grown to the next level! 🌸', {
                  duration: 4000,
                  position: 'bottom-right',
                  style: {
                    border: '2px solid #333',
                    color: '#fff',
                    backgroundColor: '#333',
                  },
                });
              }
            }
          `,
        }}
      />
      <LandingContent 
        topPosts={topPosts} 
        topProjects={topProjects} 
        isAdmin={isAdmin} 
        userId={userId}
      />
    </>
  );
}