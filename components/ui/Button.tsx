import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Button as PaperButton } from 'react-native-paper';
import { theme } from '../../styles/theme';

export interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  /** Optional. Improves screen reader experience when set. */
  accessibilityLabel?: string;
  /** Optional. Hint read after the label when focused. */
  accessibilityHint?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  loading = false,
  disabled = false,
  style,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const getMode = () => {
    switch (variant) {
      case 'primary':
        return 'contained';
      case 'secondary':
        return 'contained-tonal';
      case 'outline':
        return 'outlined';
      case 'text':
        return 'text';
      default:
        return 'contained';
    }
  };

  const getContentStyle = () => {
    switch (size) {
      case 'small':
        return styles.smallContent;
      case 'large':
        return styles.largeContent;
      default:
        return styles.mediumContent;
    }
  };

  const getContainerStyle = () => {
    const containerStyle: ViewStyle[] = [styles.container];
    if (fullWidth) {
      containerStyle.push(styles.fullWidth);
    }
    if (style) {
      containerStyle.push(style);
    }
    return containerStyle;
  };

  return (
    <View style={getContainerStyle()}>
      <PaperButton
        mode={getMode()}
        onPress={onPress}
        loading={loading}
        disabled={disabled}
        contentStyle={getContentStyle()}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        theme={{
          colors: {
            primary: theme.colors.primary,
            secondary: theme.colors.secondary,
          },
        }}
      >
        {children}
      </PaperButton>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  smallContent: {
    height: 32,
  },
  mediumContent: {
    height: 40,
  },
  largeContent: {
    height: 48,
  },
});

export default Button; 