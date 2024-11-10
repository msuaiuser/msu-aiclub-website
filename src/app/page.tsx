import { LandingContent } from '~/components/landing/landing-content';
import { createClient } from '~/utils/supabase/server';
import { getTopPostsWithUserInfo } from '~/server/db/queries/posts';
import { getTopApprovedProjects } from '~/server/db/queries/projects';
import { getUserPoints } from '~/server/db/queries/user';

export default async function HomePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const isAdmin = user?.user_metadata?.memberType === 'admin';
  const userId = user?.id || null;

  const userPoints = userId ? await getUserPoints(userId) : 0;

  console.log(userPoints);

  const topPosts = await getTopPostsWithUserInfo(3);
  const topProjects = await getTopApprovedProjects(3);

  return (
    <LandingContent 
      topPosts={topPosts} 
      topProjects={topProjects} 
      isAdmin={isAdmin} 
      userId={userId}
    />
  );
}
