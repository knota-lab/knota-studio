import { useRequest } from 'ahooks';
import { useRef, useState } from 'react';
import { z } from 'zod';
import { changePassword, updateProfile } from '@/api/auth';
import { smallUpload } from '@/api/files';
import { useAppForm } from '@/components/form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useT } from '@/i18n';
import { useAuth } from '@/stores/auth';
import { toast } from '@/utils/toast';

const profileSchema = z.object({
  name: z.string().min(1),
});

const passwordSchema = z
  .object({
    oldPassword: z.string().min(1),
    newPassword: z.string().min(6),
    confirmPassword: z.string().min(6),
  })
  .refine((data) => data.confirmPassword === data.newPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

type TabKey = 'personal' | 'password';

const ProfilePage = () => {
  const t = useT();
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('personal');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { run: runUpdateProfile, loading: updatingProfile } = useRequest(
    updateProfile,
    {
      manual: true,
      onSuccess: () => {
        void refreshUser();
        toast.success(t('Profile.updateSuccess', 'Update successful'));
      },
    },
  );

  const { run: runUploadAvatar, loading: uploadingAvatar } = useRequest(
    smallUpload,
    {
      manual: true,
      onSuccess: (fileResponse) => {
        runUpdateProfile({ avatarFileId: fileResponse.id });
      },
    },
  );

  const { run: runChangePassword, loading: changingPassword } = useRequest(
    changePassword,
    {
      manual: true,
      onSuccess: () => {
        toast.success(t('Profile.passwordChanged', 'Password changed'));
        passwordForm.reset();
      },
    },
  );

  const profileForm = useAppForm({
    validators: { onChange: profileSchema },
    defaultValues: {
      name: user?.name ?? '',
    },
    onSubmit: async ({ value }) => {
      runUpdateProfile({ name: value.name });
    },
  });

  const passwordForm = useAppForm({
    validators: { onChange: passwordSchema },
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    onSubmit: async ({ value }) => {
      runChangePassword({
        oldPassword: value.oldPassword,
        newPassword: value.newPassword,
      });
    },
  });

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      runUploadAvatar(file);
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    return parts
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  };

  const avatarSrc = user?.avatarFileId
    ? `/api/files/${user.avatarFileId}`
    : undefined;

  // biome-ignore lint/style/useNamingConvention: tab content map
  const TAB_CONTENT: Record<TabKey, React.ReactNode> = {
    personal: (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar
            size="lg"
            className="size-16 cursor-pointer"
            onClick={handleAvatarClick}
          >
            <AvatarImage src={avatarSrc} alt={user?.name} />
            <AvatarFallback className="text-lg">
              {user?.name ? getInitials(user.name) : '?'}
            </AvatarFallback>
          </Avatar>
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAvatarClick}
              disabled={uploadingAvatar}
            >
              {uploadingAvatar
                ? t('Profile.uploading', 'Uploading...')
                : t('Profile.changeAvatar', 'Change Avatar')}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void profileForm.handleSubmit();
          }}
        >
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>{t('Profile.name', 'Name')}</Label>
              <profileForm.AppField name="name">
                {(field) => (
                  <field.TextField
                    config={{
                      placeholder: t('Profile.namePlaceholder', 'Enter name'),
                    }}
                  />
                )}
              </profileForm.AppField>
            </div>

            <div className="grid gap-2">
              <Label>{t('Profile.email', 'Email')}</Label>
              <Input value={user?.email ?? ''} disabled />
            </div>

            <div>
              <Button
                type="submit"
                disabled={
                  !profileForm.state.canSubmit ||
                  profileForm.state.isSubmitting ||
                  updatingProfile
                }
              >
                {updatingProfile || profileForm.state.isSubmitting
                  ? t('Profile.saving', 'Saving...')
                  : t('Profile.save', 'Save')}
              </Button>
            </div>
          </div>
        </form>
      </div>
    ),
    password: (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void passwordForm.handleSubmit();
        }}
      >
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>{t('Profile.oldPassword', 'Current Password')}</Label>
            <passwordForm.AppField name="oldPassword">
              {(field) => (
                <field.PasswordField
                  config={{
                    placeholder: t(
                      'Profile.oldPasswordPlaceholder',
                      'Enter current password',
                    ),
                  }}
                />
              )}
            </passwordForm.AppField>
          </div>

          <div className="grid gap-2">
            <Label>{t('Profile.newPassword', 'New Password')}</Label>
            <passwordForm.AppField name="newPassword">
              {(field) => (
                <field.PasswordField
                  config={{
                    placeholder: t(
                      'Profile.newPasswordPlaceholder',
                      'Enter new password',
                    ),
                  }}
                />
              )}
            </passwordForm.AppField>
          </div>

          <div className="grid gap-2">
            <Label>{t('Profile.confirmPassword', 'Confirm Password')}</Label>
            <passwordForm.AppField name="confirmPassword">
              {(field) => (
                <field.PasswordField
                  config={{
                    placeholder: t(
                      'Profile.confirmPasswordPlaceholder',
                      'Confirm new password',
                    ),
                  }}
                />
              )}
            </passwordForm.AppField>
          </div>

          <div>
            <Button
              type="submit"
              disabled={
                !passwordForm.state.canSubmit ||
                passwordForm.state.isSubmitting ||
                changingPassword
              }
            >
              {changingPassword || passwordForm.state.isSubmitting
                ? t('Profile.changing', 'Changing...')
                : t('Profile.changePassword', 'Change Password')}
            </Button>
          </div>
        </div>
      </form>
    ),
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('Profile.title', 'Profile')}</CardTitle>
          <CardDescription>
            {t('Profile.description', 'Manage your account settings')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as TabKey)}
          >
            <TabsList variant="line">
              <TabsTrigger value="personal">
                {t('Profile.tabs.personal', 'Personal Info')}
              </TabsTrigger>
              <TabsTrigger value="password">
                {t('Profile.tabs.password', 'Change Password')}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="personal">{TAB_CONTENT.personal}</TabsContent>
            <TabsContent value="password">{TAB_CONTENT.password}</TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export { ProfilePage };
export default ProfilePage;
