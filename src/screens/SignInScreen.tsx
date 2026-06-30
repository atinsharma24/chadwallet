import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLoginWithEmail, useLoginWithOAuth } from '@privy-io/expo';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { colors, radius, spacing, typography } from '@/theme';

type Step = 'email' | 'code';

export function SignInScreen() {
  const { sendCode, loginWithCode } = useLoginWithEmail();
  const { login: loginWithOAuth, state: oauthState } = useLoginWithOAuth();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendCode = async () => {
    if (!email.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await sendCode({ email });
      setStep('code');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async () => {
    setBusy(true);
    setError(null);
    try {
      await loginWithCode({ code, email });
      // On success, Privy flips usePrivy().user -> RootNavigator swaps stacks.
    } catch (e) {
      setError('Invalid or expired code. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    try {
      await loginWithOAuth({ provider: 'google' });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.hero}>
          <Image
            source={require('../../assets/chad-logo.png')}
            style={styles.logo}
            resizeMode="cover"
          />
          <Text style={styles.title}>ChadWallet</Text>
          <Text style={styles.subtitle}>
            Trade Solana memecoins. Your wallet, created in seconds.
          </Text>
        </View>

        <View style={styles.form}>
          {step === 'email' ? (
            <>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                value={email}
                onChangeText={setEmail}
                editable={!busy}
              />
              <Button title="Continue with Email" onPress={handleSendCode} loading={busy} />

              <View style={styles.divider}>
                <View style={styles.line} />
                <Text style={styles.or}>or</Text>
                <View style={styles.line} />
              </View>

              <Button
                title="Continue with Google"
                variant="secondary"
                onPress={handleGoogle}
                loading={oauthState.status === 'loading'}
              />
            </>
          ) : (
            <>
              <Text style={styles.label}>Enter the code sent to {email}</Text>
              <TextInput
                style={[styles.input, styles.codeInput]}
                placeholder="123456"
                placeholderTextColor={colors.textTertiary}
                keyboardType="number-pad"
                maxLength={6}
                value={code}
                onChangeText={setCode}
                editable={!busy}
              />
              <Button title="Verify & Sign In" onPress={handleVerify} loading={busy} />
              <Button
                title="Use a different email"
                variant="ghost"
                onPress={() => {
                  setStep('email');
                  setCode('');
                  setError(null);
                }}
              />
            </>
          )}

          {error && <Text style={styles.error}>{error}</Text>}
        </View>

        <Text style={styles.legal}>
          By continuing you agree to ChadWallet's Terms & Privacy Policy.
        </Text>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, paddingHorizontal: spacing.xl },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  logo: {
    width: 88,
    height: 88,
    borderRadius: radius.xl,
  },
  title: { ...typography.display, color: colors.text },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  form: { gap: spacing.md, paddingBottom: spacing.xl },
  label: { ...typography.caption, color: colors.textSecondary, marginBottom: -4 },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    height: 52,
    color: colors.text,
    ...typography.body,
  },
  codeInput: { letterSpacing: 8, textAlign: 'center', fontSize: 22 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginVertical: spacing.xs },
  line: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  or: { ...typography.caption, color: colors.textTertiary },
  error: { ...typography.caption, color: colors.negative, textAlign: 'center' },
  legal: {
    ...typography.micro,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingBottom: spacing.lg,
  },
});
