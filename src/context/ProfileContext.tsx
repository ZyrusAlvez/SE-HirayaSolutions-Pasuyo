import { createContext, useContext, useEffect, useState } from 'react';
import { getUser, getHeaderProfile } from '@/models/profileModel';
import { onAuthStateChange } from '@/controllers/authController';

const DEFAULT_AVATAR = require('../assets/images/default_profile.jpg');

type VerificationStatus = 'verified' | 'pending' | 'not_verified';

interface ProfileContextType {
  avatarUrl: any;
  verificationStatus: VerificationStatus;
}

const ProfileContext = createContext<ProfileContextType>({
  avatarUrl: DEFAULT_AVATAR,
  verificationStatus: 'not_verified',
});

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [avatarUrl, setAvatarUrl] = useState<any>(DEFAULT_AVATAR);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('not_verified');

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await getUser();
      if (!user) return;
      const { data } = await getHeaderProfile(user.id);
      if (data?.avatar_url) setAvatarUrl({ uri: data.avatar_url });
      setVerificationStatus(
        data?.verified ? 'verified' : data?.pending_verification ? 'pending' : 'not_verified'
      );
    };

    fetchProfile();

    const { data: { subscription } } = onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') fetchProfile();
      if (event === 'SIGNED_OUT') {
        setAvatarUrl(DEFAULT_AVATAR);
        setVerificationStatus('not_verified');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <ProfileContext.Provider value={{ avatarUrl, verificationStatus }}>
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfile = () => useContext(ProfileContext);
