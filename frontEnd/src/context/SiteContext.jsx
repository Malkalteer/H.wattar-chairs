import { createContext, useContext } from 'react';
import { defaultSiteContent } from '../data/siteContent';

// إعدادات الموقع (الهاتف، الواتساب، العنوان...) متاحة لأي مكوّن، وتتحدث فور حفظها من لوحة التحكم
const SiteContext = createContext({ siteSettings: defaultSiteContent, applySettings: () => {} });

export const SiteProvider = SiteContext.Provider;
export const useSite = () => useContext(SiteContext);

// هل يُسمح بعرض أسعار المنتجات للزوار؟ (يتحكم به المدير من الإعدادات)
export const useShowPrices = () => useContext(SiteContext).siteSettings.showPrices !== false;
