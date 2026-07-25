import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../theme';

export const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { bottom: Math.max(insets.bottom, 10) + 6 }]}>
      <View style={styles.floatingBar}>
        {state.routes.map((route, index) => {
          const options = descriptors[route.key].options as any;

          // Skip hidden screens (href: null)
          if (options.href === null) return null;

          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const activeColor = options.tabBarActiveTintColor || Colors.primary;
          const inactiveColor = options.tabBarInactiveTintColor || Colors.textTertiary;

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabItem}
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.tabPill,
                  isFocused && { backgroundColor: `${activeColor}18` },
                ]}
              >
                {options.tabBarIcon &&
                  options.tabBarIcon({
                    focused: isFocused,
                    color: isFocused ? activeColor : inactiveColor,
                    size: 22,
                  })}
                {isFocused && (
                  <Text
                    style={[
                      styles.tabLabelActive,
                      { color: activeColor },
                    ]}
                    numberOfLines={1}
                  >
                    {typeof label === 'string' ? label : route.name}
                  </Text>
                )}
              </View>
              {isFocused && <View style={[styles.activeDot, { backgroundColor: activeColor }]} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 99,
  },
  floatingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    height: 62,
    width: '100%',
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.85)',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 18,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 22,
  },
  tabLabelActive: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
});
