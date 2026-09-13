import { MaterialIcons } from '@expo/vector-icons';
import { Tabs, Redirect, usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Platform, View, Text, StyleSheet, TouchableOpacity,
  Dimensions, Animated,
} from 'react-native';
import { openUrl } from '@/services/linkingService';
import { Image } from 'expo-image';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { useState, useEffect, useRef } from 'react';

// ── Tab definitions ────────────────────────────────────────────────────────────
const TABS = [
  { name: 'index',   route: '/(tabs)',         label: 'Market',  icon: 'show-chart'              },
  { name: 'trade',   route: '/(tabs)/trade',   label: 'Trade',   icon: 'swap-horiz'              },
  { name: 'p2p',     route: '/(tabs)/p2p',     label: 'P2P',     icon: 'people'                  },
  { name: 'wallet',  route: '/(tabs)/wallet',  label: 'Wallet',  icon: 'account-balance-wallet'  },
  { name: 'profile', route: '/(tabs)/profile', label: 'Profile', icon: 'person'                  },
] as const;

// ── Sidebar quick-links (shown only on desktop) ──────────────────────────────
// Fix 4: renamed duplicate "Sovereign" labels to unique, clear names
const SIDEBAR_LINKS = [
  { route: '/btng-sovereign-dashboard', label: 'Sovereign Dash', icon: 'security'           },
  { route: '/btng-bank',                label: 'BTNG Bank',      icon: 'account-balance'    },
  { route: '/copy-trading',             label: 'Copy Trade',     icon: 'content-copy'       },
  { route: '/btng-explorer',            label: 'Explorer',       icon: 'explore'            },
  { route: '/notifications',            label: 'Alerts',         icon: 'notifications-none' },
  { route: '/cloudflare-ssl',           label: 'CF SSL',         icon: 'https'              },
  { route: '/cloudflare-firewall',      label: 'CF Firewall',    icon: 'gpp-bad'            },
  { route: '/btng-wallet-generate',     label: 'BTNG Wallet',    icon: 'vpn-key'            },
  { route: '/btng-sovereign-engine',    label: 'Sovereign Engine', icon: 'shield'           },
  { route: '/btng-mobile-banking',      label: 'MB Core',        icon: 'account-balance'    },
  { route: '/btng-zone-engine',         label: 'Zone Engine',    icon: 'travel-explore'     },
  { route: '/btng-ports-status',        label: 'Port Health',    icon: 'sensors'            },
  { route: '/mtn-momo',                 label: 'MTN MoMo',       icon: 'phone-android'      },
  { route: '/mtn-momo-webhooks',        label: 'MoMo Webhooks',  icon: 'webhook'            },
  { route: '/btng-gold-factory',        label: 'Gold Factory',   icon: 'factory'            },
  { route: '/btng-gold-factory-leaderboard', label: 'Mine Leaderboard', icon: 'emoji-events' },
  { route: '/btng-server-terminal',     label: 'Server Terminal', icon: 'terminal'          },
  { route: '/btng-server-stats',        label: 'Server Stats',   icon: 'monitor-heart'      },
  { route: '/btng-network-fabric',      label: 'Network Fabric', icon: 'device-hub'         },
  { route: 'https://admin.bituncoin.io/dashboard/home', label: 'Dokploy', icon: 'cloud-upload' },
  { route: '/btng-chat-webview',        label: 'BTNG Chat',      icon: 'chat'               },
] as const;

// Fix 1: Robust active-link helper that handles external URLs and nested routes
function isLinkActive(currentPath: string, route: string): boolean {
  if (route.startsWith('http://') || route.startsWith('https://')) return false;
  if (currentPath === route) return true;
  if (currentPath.startsWith(route + '/')) return true;
  return false;
}

// ── Desktop Sidebar ───────────────────────────────────────────────────────────
function DesktopSidebar({ insetTop, insetBottom }: { insetTop: number; insetBottom: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const collapseAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim    = useRef(new Animated.Value(0.4)).current;

  // Live gold dot pulse
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1,   duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const toggleCollapse = () => {
    const next = !collapsed;
    Animated.timing(collapseAnim, {
      toValue: next ? 0 : 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
    setCollapsed(next);
  };

  const sidebarW = collapseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [64, 220],
  });

  const isActiveTab = (tabName: string) => {
    if (tabName === 'index') return pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/index';
    return pathname.includes(tabName);
  };

  return (
    <Animated.View style={[sb.sidebar, { width: sidebarW, paddingTop: insetTop, paddingBottom: insetBottom }]}>
      {/* Brand row */}
      <View style={sb.brandRow}>
        <View style={sb.brandLogoWrap}>
          <Image
            source={require('@/assets/images/icon.png')}
            style={sb.brandLogo}
            contentFit="cover"
          />
          <Animated.View style={[sb.brandLiveDot, { opacity: pulseAnim }]} />
        </View>
        {!collapsed && (
          <View style={sb.brandTextBlock}>
            <Text style={sb.brandName} numberOfLines={1}>BTNG Bank</Text>
            <Text style={sb.brandSub} numberOfLines={1}>Gold · Sovereign · Web3</Text>
          </View>
        )}
        <TouchableOpacity style={sb.collapseBtn} onPress={toggleCollapse} activeOpacity={0.7}>
          <MaterialIcons
            name={collapsed ? 'chevron-right' : 'chevron-left'}
            size={16}
            color={Colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      <View style={sb.divider} />

      {/* Main tabs */}
      {!collapsed && (
        <Text style={sb.sectionLabel}>NAVIGATION</Text>
      )}
      <View style={sb.navSection}>
        {TABS.map((tab) => {
          const active = isActiveTab(tab.name);
          return (
            <TouchableOpacity
              key={tab.name}
              style={[sb.navItem, active && sb.navItemActive, collapsed && sb.navItemCollapsed]}
              // Fix 2: use replace to avoid route stack growth
              onPress={() => router.replace(tab.route as any)}
              activeOpacity={0.75}
            >
              <View style={[sb.navIconWrap, active && sb.navIconWrapActive, collapsed && sb.navIconWrapCollapsed]}>
                <MaterialIcons
                  name={tab.icon as any}
                  size={20}
                  color={active ? Colors.primary : Colors.textMuted}
                />
              </View>
              {!collapsed && (
                <Text style={[sb.navLabel, active && sb.navLabelActive]} numberOfLines={1}>
                  {tab.label}
                </Text>
              )}
              {active && <View style={sb.activeBar} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={sb.divider} />

      {/* Quick links */}
      {!collapsed && (
        <Text style={sb.sectionLabel}>QUICK ACCESS</Text>
      )}
      <View style={[sb.navSection, { flex: 1 }]}>
        {SIDEBAR_LINKS.map((link) => {
          // Fix 1: use robust helper instead of brittle pathname.includes(...)
          const active = isLinkActive(pathname, link.route);
          const isExternal = link.route.startsWith('http://') || link.route.startsWith('https://');
          return (
            <TouchableOpacity
              key={link.route}
              style={[sb.navItem, active && sb.navItemActive, collapsed && sb.navItemCollapsed]}
              onPress={() => {
                if (isExternal) {
                  openUrl(link.route);
                } else {
                  // Fix 2: use replace for internal sidebar links
                  router.replace(link.route as any);
                }
              }}
              activeOpacity={0.75}
            >
              <View style={[sb.navIconWrap, active && sb.navIconWrapActive, collapsed && sb.navIconWrapCollapsed]}>
                <MaterialIcons
                  name={link.icon as any}
                  size={18}
                  color={active ? Colors.primary : Colors.textMuted}
                />
              </View>
              {!collapsed && (
                <Text style={[sb.navLabel, active && sb.navLabelActive]} numberOfLines={1}>
                  {link.label}
                </Text>
              )}
              {active && <View style={sb.activeBar} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={sb.divider} />

      {/* Profile row */}
      <View style={[sb.profileRow, collapsed && sb.profileRowCollapsed]}>
        <View style={sb.avatarWrap}>
          <MaterialIcons name="person" size={20} color={Colors.primary} />
        </View>
        {!collapsed && (
          <View style={{ flex: 1 }}>
            <Text style={sb.profileName} numberOfLines={1}>
              {user?.displayName ?? user?.email ?? 'User'}
            </Text>
            <Text style={sb.profileEmail} numberOfLines={1}>
              {user?.email ?? ''}
            </Text>
          </View>
        )}
      </View>

      {/* Status footer */}
      <View style={sb.statusFooter}>
        <View style={sb.statusDot} />
        {!collapsed && (
          <Text style={sb.statusText}>LIVE · SECURE</Text>
        )}
      </View>
    </Animated.View>
  );
}

const sb = StyleSheet.create({
  sidebar: {
    backgroundColor: Colors.bgCard,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    flexDirection: 'column',
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    gap: Spacing.sm,
    minHeight: 60,
  },
  brandLogoWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.primary + '66',
    flexShrink: 0,
    position: 'relative',
  },
  brandLogo: { width: 36, height: 36, borderRadius: 10 },
  brandLiveDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
    borderWidth: 1.5,
    borderColor: Colors.bgCard,
  },
  brandTextBlock: { flex: 1, gap: 2 },
  brandName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.heavy,
    color: Colors.primary,
    includeFontPadding: false,
  },
  brandSub: {
    fontSize: 9,
    color: Colors.textMuted,
    includeFontPadding: false,
  },
  collapseBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: FontWeight.heavy,
    color: Colors.textMuted,
    letterSpacing: 1.2,
    includeFontPadding: false,
    paddingHorizontal: Spacing.md + 4,
    marginBottom: 4,
  },
  navSection: { gap: 2, paddingHorizontal: Spacing.sm },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm - 1,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 44,
  },
  navItemActive: {
    backgroundColor: Colors.primaryGlow,
  },
  navItemCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  navIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  navIconWrapActive: {
    backgroundColor: Colors.primaryGlow,
    borderWidth: 1,
    borderColor: Colors.primary + '44',
  },
  navIconWrapCollapsed: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  navLabel: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textMuted,
    includeFontPadding: false,
  },
  navLabelActive: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
  activeBar: {
    position: 'absolute',
    right: 0,
    top: 10,
    bottom: 10,
    width: 3,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    minHeight: 52,
  },
  profileRowCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
  },
  avatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryGlow,
    borderWidth: 1.5,
    borderColor: Colors.primary + '55',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  profileName: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    includeFontPadding: false,
  },
  profileEmail: {
    fontSize: 9,
    color: Colors.textMuted,
    includeFontPadding: false,
    marginTop: 1,
  },
  statusFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.successBg,
    borderTopWidth: 1,
    borderTopColor: Colors.success + '22',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  statusText: {
    fontSize: 9,
    fontWeight: FontWeight.heavy,
    color: Colors.success,
    includeFontPadding: false,
    letterSpacing: 0.5,
  },
});

// ── Root Layout ────────────────────────────────────────────────────────────────
export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, loading } = useAuth();
  const [dims, setDims] = useState(() => Dimensions.get('window'));

  // Fix 5: resilient Dimensions listener cleanup compatible across RN/Expo versions
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setDims(window));
    return () => {
      if (typeof sub?.remove === 'function') {
        sub.remove();
      }
    };
  }, []);

  const isTablet  = dims.width >= 768;
  const isDesktop = dims.width >= 1024;

  if (loading) return null;
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  if (isDesktop) {
    // Fix 3: normal flex row layout — no absolute positioning on root wrapper
    return (
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: Colors.bgCard }}>
        <DesktopSidebar insetTop={insets.top} insetBottom={insets.bottom} />
        <View style={{ flex: 1 }}>
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarStyle: { display: 'none' },
            }}
          >
            {TABS.map((tab) => (
              <Tabs.Screen key={tab.name} name={tab.name} />
            ))}
          </Tabs>
        </View>
      </View>
    );
  }

  // Mobile / tablet tab bar
  return (
    <Tabs
      screenOptions={({ route }) => {
        const tab = TABS.find((t) => t.name === route.name);
        return {
          headerShown: false,
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textMuted,
          tabBarStyle: {
            backgroundColor: Colors.bgCard,
            borderTopColor: Colors.border,
            paddingBottom: insets.bottom,
            height: 56 + insets.bottom,
          },
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name={(tab?.icon ?? 'circle') as any} size={size} color={color} />
          ),
          tabBarLabel: tab?.label ?? route.name,
        };
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} />
      ))}
    </Tabs>
  );
}
