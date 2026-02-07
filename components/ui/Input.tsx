import React from 'react';
import { StyleSheet, TextStyle, View, ViewStyle } from 'react-native';
import { TextInput, HelperText } from 'react-native-paper';
import { theme } from '../../styles/theme';

export interface InputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  helper?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  disabled?: boolean;
  style?: ViewStyle;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  /** Optional. Defaults to label. Use for clearer screen reader context. */
  accessibilityLabel?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  value,
  onChangeText,
  error,
  helper,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  disabled = false,
  style,
  multiline = false,
  numberOfLines = 1,
  maxLength,
  accessibilityLabel: accessibilityLabelProp,
}) => {
  const accessibilityLabel = accessibilityLabelProp ?? label;
  const getHelperColor = (): TextStyle['color'] => {
    if (error) {
      return theme.colors.error;
    }
    return theme.colors.onSurfaceVariant;
  };

  return (
    <View style={[styles.container, style]}>
      <TextInput
        mode="outlined"
        label={label}
        value={value}
        onChangeText={onChangeText}
        error={!!error}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        disabled={disabled}
        multiline={multiline}
        numberOfLines={numberOfLines}
        maxLength={maxLength}
        style={styles.input}
        accessibilityLabel={accessibilityLabel}
        theme={{
          colors: {
            primary: theme.colors.primary,
            error: theme.colors.error,
          },
        }}
      />
      {(error || helper) && (
        <HelperText
          type={error ? 'error' : 'info'}
          visible={true}
          style={{ color: getHelperColor() }}
        >
          {error || helper}
        </HelperText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  input: {
    backgroundColor: theme.colors.surface,
  },
});

export default Input; 