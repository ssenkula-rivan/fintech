// GMG Uganda Mobile App - Reusable Input Component
import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, TouchableOpacity } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
}

export default function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  style,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputFocused,
        error && styles.inputError,
      ]}>
        {leftIcon && <Text style={styles.leftIcon}>{leftIcon}</Text>}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor="#666"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress}>
            <Text style={styles.rightIcon}>{rightIcon}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#BBBBBB',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputFocused: {
    borderColor: '#0066FF',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#fff',
  },
  leftIcon: {
    fontSize: 20,
    marginLeft: 16,
  },
  rightIcon: {
    fontSize: 20,
    marginRight: 16,
  },
  error: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
});
