import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Surface } from 'react-native-paper';
import { theme } from '../../styles/theme';

export interface CardProps {
  children: React.ReactNode;
  mode?: 'elevated' | 'outlined' | 'contained';
  padding?: 'none' | 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  children,
  mode = 'elevated',
  padding = 'medium',
  style,
}) => {
  const getElevation = () => {
    switch (mode) {
      case 'elevated':
        return 1;
      case 'outlined':
      case 'contained':
        return 0;
      default:
        return 1;
    }
  };

  const getContainerStyle = () => {
    const containerStyle = [
      styles.container,
      mode === 'outlined' ? styles.outlined : undefined,
      mode === 'contained' ? styles.contained : undefined,
      getPaddingStyle(),
    ].filter(Boolean) as ViewStyle[];

    if (style) {
      containerStyle.push(style);
    }

    return containerStyle;
  };

  const getPaddingStyle = () => {
    switch (padding) {
      case 'none':
        return styles.paddingNone;
      case 'small':
        return styles.paddingSmall;
      case 'large':
        return styles.paddingLarge;
      default:
        return styles.paddingMedium;
    }
  };

  return (
    <Surface style={getContainerStyle()} elevation={getElevation()}>
      {children}
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
  },
  outlined: {
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  contained: {
    backgroundColor: theme.colors.surfaceVariant,
  },
  paddingNone: {
    padding: 0,
  },
  paddingSmall: {
    padding: 12,
  },
  paddingMedium: {
    padding: 16,
  },
  paddingLarge: {
    padding: 24,
  },
});

export default Card; 