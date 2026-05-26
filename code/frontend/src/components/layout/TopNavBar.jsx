import React from 'react';
import useAuthStore from '@store/useAuthStore';
import { getInitials, getAvatarColor } from '@utils/avatarHelper';

import { NotificationDropdown } from './NotificationDropdown';

const TopNavBar = () => {
  const fullName = useAuthStore((state) => state.fullName);
  const initials = getInitials(fullName);
  const avatarColor = getAvatarColor(fullName);

  return (
    <header className="bg-surface-container-lowest dark:bg-surface-dim text-primary dark:text-primary-fixed font-body-lg text-body-lg fixed top-0 w-full h-topbar_height border-b border-outline-variant dark:border-outline flex justify-between items-center px-margin_desktop z-50 md:w-[calc(100%-280px)]">
      <div className="flex items-center gap-4">
        <button className="md:hidden text-on-surface-variant p-2 -ml-2">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="text-headline-sm font-headline-sm text-primary-container dark:text-primary-fixed-dim font-bold tracking-tight">DevTrack AI</div>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative hidden sm:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
          <input className="pl-10 pr-4 py-1.5 bg-surface-container-low border-none rounded-full text-body-md font-body-md text-on-surface focus:ring-2 focus:ring-primary-container w-[200px] lg:w-[300px] transition-all" placeholder="Search..." type="text" />
        </div>
        <NotificationDropdown />
        {/* Avatar động theo người đăng nhập */}
        <div className="w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold text-xs shadow-inner shrink-0 cursor-pointer border border-outline-variant/40">
          {initials}
        </div>
      </div>
    </header>
  );
};

export default TopNavBar;
