import { createContext, useContext, useEffect, useState } from 'react';
import { getProfile } from '@/controllers/profileController';

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
    getProfile().then((result) => {
      if (result.success && result.data) {
        if (result.data.avatarUrl) setAvatarUrl({ uri: result.data.avatarUrl });
        setVerificationStatus(result.data.verificationStatus);
      }
    });
  }, []);

  return (
    <ProfileContext.Provider value={{ avatarUrl, verificationStatus }}>
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfile = () => useContext(ProfileContext);
