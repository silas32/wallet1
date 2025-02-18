import * as React from 'react';
import { KeyboardTypeOptions, ReturnKeyTypeOptions, StyleProp, View, ViewStyle, Text, TextStyle, Pressable, TouchableWithoutFeedback, Platform } from 'react-native';
import { TextInput } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut, cancelAnimation, interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { ForwardedRef, RefObject, forwardRef, memo, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useTheme } from '../engine/hooks';

import Clear from '@assets/ic-clear.svg';

export type ATextInputRef = {
    focus: () => void;
    blur?: () => void;
}

export interface ATextInputProps {
    style?: StyleProp<ViewStyle>;
    inputStyle?: StyleProp<TextStyle>;
    placeholder?: string;
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    autoCorrect?: boolean;
    keyboardType?: KeyboardTypeOptions;
    returnKeyType?: ReturnKeyTypeOptions;
    autoComplete?:
    | 'birthdate-day'
    | 'birthdate-full'
    | 'birthdate-month'
    | 'birthdate-year'
    | 'cc-csc'
    | 'cc-exp'
    | 'cc-exp-day'
    | 'cc-exp-month'
    | 'cc-exp-year'
    | 'cc-number'
    | 'email'
    | 'gender'
    | 'name'
    | 'name-family'
    | 'name-given'
    | 'name-middle'
    | 'name-middle-initial'
    | 'name-prefix'
    | 'name-suffix'
    | 'password'
    | 'password-new'
    | 'postal-address'
    | 'postal-address-country'
    | 'postal-address-extended'
    | 'postal-address-extended-postal-code'
    | 'postal-address-locality'
    | 'postal-address-region'
    | 'postal-code'
    | 'street-address'
    | 'sms-otp'
    | 'tel'
    | 'tel-country-code'
    | 'tel-national'
    | 'tel-device'
    | 'username'
    | 'username-new'
    | 'off'
    | undefined;
    value?: string;
    onValueChange?: (value: string) => void;
    autoFocus?: boolean;
    multiline?: boolean;
    enabled?: boolean;
    editable?: boolean;
    textContentType?:
    | 'none'
    | 'URL'
    | 'addressCity'
    | 'addressCityAndState'
    | 'addressState'
    | 'countryName'
    | 'creditCardNumber'
    | 'emailAddress'
    | 'familyName'
    | 'fullStreetAddress'
    | 'givenName'
    | 'jobTitle'
    | 'location'
    | 'middleName'
    | 'name'
    | 'namePrefix'
    | 'nameSuffix'
    | 'nickname'
    | 'organizationName'
    | 'postalCode'
    | 'streetAddressLine1'
    | 'streetAddressLine2'
    | 'sublocality'
    | 'telephoneNumber'
    | 'username'
    | 'password'
    | 'newPassword'
    | 'oneTimeCode';

    prefix?: string;
    textAlign?: 'left' | 'center' | 'right' | undefined,
    fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' | undefined;
    fontSize?: number | undefined;
    lineHeight?: number | undefined;
    actionButtonRight?: { component: React.ReactNode, width: number },
    blurOnSubmit?: boolean,
    innerRef?: RefObject<View>,
    onFocus?: (index: number) => void,
    onBlur?: (index: number) => void,
    onSubmit?: (index: number) => void,
    index?: number,
    label?: string,
    labelStyle?: StyleProp<ViewStyle>,
    labelTextStyle?: StyleProp<TextStyle>,
    backgroundColor?: string,
    textAlignVertical?: 'auto' | 'top' | 'bottom' | 'center' | undefined,
    suffix?: string,
    suffixStyle?: StyleProp<TextStyle>,
    error?: string,
    hideClearButton?: boolean,
    maxLength?: number,
}

export const ATextInput = memo(forwardRef((props: ATextInputProps, ref: ForwardedRef<ATextInputRef>) => {
    const theme = useTheme();

    const [focused, setFocused] = useState(false);

    const hasValue = useMemo(() => (props.value && props.value.length > 0), [props.value]);

    const onFocus = useCallback(() => {
        setFocused(true);
        if (props.onFocus && typeof props.index === 'number') {
            props.onFocus(props.index);
        }
    }, [props.index]);
    const onSubmit = useCallback(() => {
        if (props.onSubmit && props.index) {
            props.onSubmit(props.index);
        }
    }, [props.index]);
    const onBlur = useCallback(() => {
        setFocused(false);
        if (props.onBlur && typeof props.index === 'number') {
            props.onBlur(props.index);
        }
    }, [props.index]);

    const tref = useRef<TextInput>(null);
    useImperativeHandle(ref, () => ({
        focus: () => {
            tref.current!.focus();
        },
        blur: () => {
            tref.current!.blur();
        }
    }), [ref, tref]);

    const valueNotEmptyShared = useSharedValue(0);
    const labelHeightCoeff = useSharedValue(1);

    const withLabel = !!props.label;
    const valueNotEmpty = (props.value?.length || 0) > 0;

    const labelAnimStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { scale: interpolate(valueNotEmptyShared.value, [0, 1], [1, 0.8]) },
                { translateX: interpolate(valueNotEmptyShared.value, [0, 1], [0, -44]) },
                { translateY: interpolate(valueNotEmptyShared.value, [0, 1], [2, -13]) },
            ]
        }
    });

    const labelShiftStyle = useAnimatedStyle(() => {
        return {
            height: interpolate(valueNotEmptyShared.value, [0, 1], [0, labelHeightCoeff.value * 10]),
        }
    });

    const inputHeightCompensatorStyle = useAnimatedStyle(() => {
        return {
            marginBottom: interpolate(valueNotEmptyShared.value, [0, 1], [0, labelHeightCoeff.value * -4])
        }
    });

    useEffect(() => {
        cancelAnimation(valueNotEmptyShared);
        valueNotEmptyShared.value = withTiming(withLabel && valueNotEmpty ? 1 : 0, { duration: 100 });
    }, [withLabel, valueNotEmpty]);

    return (
        <TouchableWithoutFeedback
            style={{ position: 'relative' }}
            onPress={() => {
                if (!focused) {
                    tref.current?.focus();
                    return;
                }
            }}
        >
            <Animated.View style={[
                {
                    borderRadius: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    minHeight: 26,
                    position: 'relative',
                },
                props.style
            ]}>
                {withLabel && (
                    <View style={{ position: 'absolute', top: 0, right: 0, left: 16 }}>
                        <Animated.View style={[labelAnimStyle, props.labelStyle, { paddingRight: props.actionButtonRight?.width }]}>
                            <Text
                                numberOfLines={1}
                                onTextLayout={(e) => {
                                    if (e.nativeEvent.lines.length <= 1) {
                                        labelHeightCoeff.value = 1;
                                        return;
                                    }
                                    labelHeightCoeff.value = e.nativeEvent.lines.length * 1.4;
                                }}
                                style={[
                                    {
                                        color: theme.textSecondary,
                                        fontSize: 17,
                                        fontWeight: '400'
                                    },
                                    props.labelTextStyle
                                ]}
                            >
                                {props.label}
                            </Text>
                        </Animated.View>
                    </View>
                )}
                <View style={{ width: '100%', flex: 1, position: 'relative' }}>
                    <Animated.View style={labelShiftStyle} />
                    <View
                        style={{ flexDirection: 'row', alignItems: 'center' }}
                        ref={props.innerRef}
                    >
                        <TextInput
                            ref={tref}
                            hitSlop={16}
                            style={[
                                {
                                    color: theme.textPrimary,
                                    fontSize: props.fontSize !== undefined ? props.fontSize : 17,
                                    lineHeight: props.lineHeight !== undefined ? props.lineHeight : undefined,
                                    fontWeight: props.fontWeight ? props.fontWeight : '400',
                                    textAlignVertical: props.textAlignVertical
                                        ? props.textAlignVertical
                                        : props.multiline
                                            ? 'top'
                                            : 'center',
                                    width: '100%',
                                    marginHorizontal: 0, marginVertical: 0,
                                    paddingBottom: 0, paddingTop: 0, paddingVertical: 0,
                                    paddingLeft: 0, paddingRight: 0,
                                },
                                props.inputStyle
                            ]}
                            selectionColor={Platform.select({
                                ios: theme.accent,
                                android: 'rgba(0, 0, 0, 0.3)',
                            })}
                            cursorColor={theme.textPrimary}
                            textAlign={props.textAlign}
                            autoFocus={props.autoFocus}
                            placeholderTextColor={theme.textSecondary}
                            autoCapitalize={props.autoCapitalize}
                            placeholder={props.label ? undefined : props.placeholder}
                            autoCorrect={props.autoCorrect}
                            keyboardType={props.keyboardType}
                            returnKeyType={props.returnKeyType}
                            autoComplete={props.autoComplete}
                            multiline={props.multiline}
                            enabled={props.enabled}
                            blurOnSubmit={props.blurOnSubmit}
                            editable={props.editable}
                            value={props.value}
                            onChangeText={props.onValueChange}
                            textContentType={props.textContentType}
                            onFocus={onFocus}
                            onBlur={onBlur}
                            onSubmitEditing={onSubmit}
                            maxLength={props.maxLength}
                        />
                        {props.prefix && (
                            <Text
                                numberOfLines={1}
                                style={{
                                    fontSize: 17,
                                    fontWeight: '400',
                                    alignSelf: 'center',
                                    marginLeft: 2,
                                    color: theme.textSecondary,
                                }}
                            >
                                {props.prefix}
                            </Text>
                        )}
                        {props.suffix && (
                            <Text
                                numberOfLines={1}
                                ellipsizeMode={'tail'}
                                style={[
                                    {
                                        flexGrow: 1,
                                        fontSize: 15, lineHeight: 20,
                                        fontWeight: '400',
                                        alignSelf: 'center',
                                        color: theme.textSecondary,
                                        flexShrink: 1,
                                        textAlign: 'right',
                                    },
                                    props.suffixStyle
                                ]}
                            >
                                {props.suffix}
                            </Text>
                        )}
                    </View>
                    <Animated.View style={inputHeightCompensatorStyle} />
                </View>
                {!!props.actionButtonRight
                    ? (props.actionButtonRight.component)
                    : !props.hideClearButton && focused && hasValue && (
                        <Animated.View entering={FadeIn} exiting={FadeOut}>
                            <Pressable
                                onPress={() => {
                                    if (props.onValueChange) {
                                        props.onValueChange('');
                                    }
                                }}
                                style={{ height: 24, width: 24 }}
                                hitSlop={16}
                            >
                                <Clear height={24} width={24} style={{ height: 24, width: 24 }} />
                            </Pressable>
                        </Animated.View>
                    )
                }
            </Animated.View>
            {/* {props.error && (
                <Animated.View style={{ marginTop: 2, marginLeft: 16 }} layout={Layout.duration(300)}>
                    <Text style={{ color: Theme.accentRed, fontSize: 13, lineHeight: 18, fontWeight: '400' }}>
                        {props.error}
                    </Text>
                </Animated.View>
            )} */}
        </TouchableWithoutFeedback>
    )
}));