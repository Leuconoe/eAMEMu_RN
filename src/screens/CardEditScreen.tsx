import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextInputFocusEventData,
  NativeSyntheticEvent,
  TouchableOpacityProps,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Shadow } from 'react-native-shadow-2';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import styled from 'styled-components/native';

import CardConv from '../modules/CardConv';
import { RootStackParams } from '../../App';
import CardView from '../components/Card';
import { addCard, updateCard } from '../data/cards';
import { Card } from '../types';
import { useTranslation } from 'react-i18next';

type TextFieldProps = TextInputProps & {
  title: string;
  containerStyle?: ViewStyle;
};

const generateRandomCardNumber = () => {
  const getRandom4Byte = () => {
    return Math.trunc(Math.random() * 65536)
      .toString(16)
      .toUpperCase()
      .padStart(4, '0');
  };

  return `02FE${getRandom4Byte()}${getRandom4Byte()}${getRandom4Byte()}`;
};

const Container = styled.KeyboardAvoidingView`
  flex: 1;
  background-color: ${props => props.theme.colors.background};
`;

const FieldTitle = styled(Text)<{ focused: boolean }>`
  font-size: 14px;
  font-weight: bold;
  color: ${props =>
    props.focused
      ? props.theme.colors.primary
      : props.theme.colors.placeholder};
`;

const FieldBottomBorder = styled.View<{ focused: boolean }>`
  padding-top: 2px;
  background-color: ${props =>
    props.focused
      ? props.theme.colors.primary
      : props.theme.colors.placeholder};
  height: ${props => (props.focused ? 2 : 1)}px;
`;

const FieldErrorText = styled(Text)`
  padding-top: 4px;
  font-size: 12px;
  color: ${props => props.theme.colors.error};
`;

const FieldWarningText = styled(Text)`
  padding-top: 4px;
  font-size: 12px;
  color: ${props => props.theme.colors.warning};
`;

const StyledTextInput = styled.TextInput`
  font-size: 16px;
  padding-top: 4px;
  color: ${props =>
    props.editable !== false
      ? props.theme.colors.text
      : props.theme.colors.disabled};
`;

const ButtonContainer = styled.TouchableOpacity`
  height: 48px;
  background-color: ${props => props.theme.colors.primary};
  justify-content: center;
  align-items: center;
  opacity: ${props => (props.disabled ? 0.5 : 1)};
`;

const ButtonText = styled.Text`
  font-size: 16px;
  color: ${props => props.theme.colors.white};
`;

type ButtonProps = {
  text: string;
  containerStyle: ViewStyle;
} & TouchableOpacityProps;

const Button = (props: ButtonProps) => {
  const { text, containerStyle, ...touchableProps } = props;

  return (
    <Shadow
      style={styles.buttonShadowStyle}
      containerStyle={containerStyle}
      distance={4}
    >
      {/* shadow가 정상적으로 적용되지 않는 버그가 있어서 borderRadius 스타일을 분리 */}
      <ButtonContainer {...touchableProps} style={styles.buttonBorderRadius}>
        <ButtonText>{text}</ButtonText>
      </ButtonContainer>
    </Shadow>
  );
};

const TextField = (props: TextFieldProps) => {
  const { onFocus, onBlur, title, containerStyle, ...textInputProps } = props;

  const [isFocused, setIsFocused] = useState<boolean>(false);
  const onFocusCallback = useCallback(
    (event: NativeSyntheticEvent<TextInputFocusEventData>) => {
      setIsFocused(true);
      onFocus?.(event);
    },
    [onFocus],
  );

  const onBlurCallback = useCallback(
    (event: NativeSyntheticEvent<TextInputFocusEventData>) => {
      setIsFocused(false);
      onBlur?.(event);
    },
    [onBlur],
  );

  return (
    <View style={containerStyle}>
      <FieldTitle focused={isFocused}>{title}</FieldTitle>
      <StyledTextInput
        onFocus={onFocusCallback}
        onBlur={onBlurCallback}
        {...textInputProps}
      />
      <FieldBottomBorder focused={isFocused} />
    </View>
  );
};

type CardAddScreenProps = NativeStackScreenProps<RootStackParams, 'Add'>;
type CardEditScreenProps = NativeStackScreenProps<RootStackParams, 'Edit'>;

const CardEditScreen = (props: CardAddScreenProps | CardEditScreenProps) => {
  const { t } = useTranslation();
  const initialData = props.route.params?.card ?? undefined;

  const [mode] = useState<'add' | 'edit'>(() => {
    return initialData ? 'edit' : 'add';
  });

  const [cardName, setCardName] = useState<string>(initialData?.name ?? 'eAM');

  // cardNumber holds the SID (internal 16-hex identifier). It is the single
  // source of truth used for saving and for the preview card.
  const [cardNumber, setCardNumber] = useState<string>(() => {
    return initialData?.sid ?? generateRandomCardNumber();
  });

  // konamiDraft is the KONAMI ID (the number printed on the card) the user
  // edits. It is kept in sync with cardNumber (SID) through convertSID.
  const [konamiDraft, setKonamiDraft] = useState<string>('');
  const [konamiValid, setKonamiValid] = useState<boolean>(true);
  // Whether the current konamiDraft has been seeded from the SID yet. Reset to
  // false when the SID changes externally (e.g. random generation) so the
  // draft re-syncs; stays true while the user is typing so we never overwrite
  // their input.
  const seeded = useRef<boolean>(false);

  const uid = useQuery(['uid', cardNumber], () =>
    CardConv.convertSID(cardNumber),
  );

  // Seed the editable KONAMI ID from the SID-derived value once it resolves.
  useEffect(() => {
    if (uid.isSuccess && !seeded.current) {
      setKonamiDraft(uid.data);
      setKonamiValid(true);
      seeded.current = true;
    }
  }, [uid.isSuccess, uid.data]);

  const onChangeCardName = useCallback((s: string) => {
    setCardName(s);
  }, []);

  const applyKonami = useCallback(async (draft: string) => {
    try {
      const sid = await CardConv.convertKonamiID(draft);
      setCardNumber(sid);
      setKonamiValid(true);
    } catch {
      setKonamiValid(false);
    }
  }, []);

  const onChangeKonami = useCallback(
    (text: string) => {
      const normalized = text
        .toUpperCase()
        .replace(/[^0-9A-Z]/g, '')
        .slice(0, 16);
      setKonamiDraft(normalized);

      if (normalized.length === 16) {
        applyKonami(normalized);
      } else {
        setKonamiValid(false);
      }
    },
    [applyKonami],
  );

  const changeCardNumber = useCallback(() => {
    // Re-seed the draft from the newly generated SID.
    seeded.current = false;
    setKonamiValid(true);
    setCardNumber(generateRandomCardNumber());
  }, []);

  const queryClient = useQueryClient();
  const addMutation = useMutation(
    (card: Card) => {
      return addCard(card);
    },
    {
      onSuccess: async () => {
        await queryClient.invalidateQueries('cards');
        props.navigation.goBack();
      },
    },
  );
  const editMutation = useMutation(
    ({ index, card }: { index: number; card: Card }) => {
      return updateCard(index, card);
    },
    {
      onSuccess: async () => {
        await queryClient.invalidateQueries('cards');
        props.navigation.goBack();
      },
    },
  );

  const save = useCallback(() => {
    const card = {
      sid: cardNumber,
      name: cardName,
    };

    if (mode === 'add') {
      addMutation.mutate(card);
    } else {
      editMutation.mutate({ index: props.route.params!.index, card: card });
    }
  }, [
    addMutation,
    cardName,
    cardNumber,
    editMutation,
    mode,
    props.route.params,
  ]);

  return (
    <Container>
      <ScrollView
        contentContainerStyle={styles.scrollView}
        keyboardShouldPersistTaps="handled"
      >
        <CardView
          card={{
            sid: cardNumber,
            name: cardName,
          }}
          mainText={t('card_edit.card_preview')}
          index={0 /* dummy index */}
          disabledMainButton={true}
          hideBottomMenu={true}
        />

        <View style={[styles.fieldItemContainer]}>
          <TextField
            title={t('card_edit.card_name')}
            value={cardName}
            onChangeText={onChangeCardName}
          />
        </View>

        <View style={styles.fieldItemContainer}>
          <TextField
            title={t('card_edit.card_number')}
            value={konamiDraft}
            onChangeText={onChangeKonami}
            placeholder={t('card_edit.card_number_placeholder')}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={16}
          />
          {!konamiValid && (
            <FieldErrorText>
              {t('card_edit.invalid_card_number')}
            </FieldErrorText>
          )}
          {konamiValid &&
            konamiDraft.length === 16 &&
            !cardNumber.toUpperCase().startsWith('02FE') && (
              <FieldWarningText>
                {t('card_edit.card_not_emulatable')}
              </FieldWarningText>
            )}
          <Button
            containerStyle={styles.cardNumberChangeButton}
            onPress={changeCardNumber}
            text={t('card_edit.change_card_number')}
          />
        </View>

        <Button
          onPress={save}
          containerStyle={styles.saveButton}
          disabled={!konamiValid || konamiDraft.length !== 16}
          text={t('card_edit.save')}
        />
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollView: {
    padding: 16,
  },
  fieldItemContainer: {
    paddingTop: 32,
  },
  buttonShadowStyle: {
    width: '100%',
  },
  buttonBorderRadius: {
    borderRadius: 8,
  },
  saveButton: {
    marginTop: 32,
  },
  cardNumberChangeButton: {
    marginTop: 16,
  },
});

export default CardEditScreen;
