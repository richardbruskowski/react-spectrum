import {ButtonProps} from '@react-types/button';
import {chain, mergeProps, filterDOMProps} from '@react-aria/utils';
import {RefObject, useContext} from 'react';
import {useFocusable} from '@react-aria/focus';
import {usePress} from '@react-aria/interactions';

import {DOMPropsResponderContext} from '@react-aria/interactions';

interface AriaButtonProps extends ButtonProps {
  isSelected?: boolean,
  validationState?: 'valid' | 'invalid', // used by FieldButton (e.g. DatePicker, ComboBox)
  'aria-expanded'?: boolean | 'false' | 'true',
  'aria-haspopup'?: boolean | 'false' | 'true' | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog',
  type?: 'button' | 'submit'
}

interface ButtonAria {
  buttonProps: React.ButtonHTMLAttributes<HTMLButtonElement>,
  isPressed: boolean
}

export function useButton(props: AriaButtonProps, ref: RefObject<HTMLElement>): ButtonAria {
  let {
    elementType = 'button',
    isDisabled,
    onPress,
    onPressStart,
    onPressEnd,
    onPressChange,
    // @ts-ignore
    onClick: deprecatedOnClick,
    href,
    tabIndex,
    isSelected,
    validationState,
    'aria-expanded': ariaExpanded,
    'aria-haspopup': ariaHasPopup,
    type = 'button'
  } = props;
  let additionalProps;
  if (elementType !== 'button') {
    additionalProps = {
      role: 'button',
      tabIndex: isDisabled ? undefined : (tabIndex || 0),
      'aria-disabled': isDisabled || undefined,
      href: elementType === 'a' && isDisabled ? undefined : href
    };
  }

  let {pressProps, isPressed} = usePress({
    // Safari does not focus buttons automatically when interacting with them, so do it manually
    onPressStart: chain(onPressStart, (e) => e.target.focus()),
    onPressEnd: chain(onPressEnd, (e) => e.target.focus()),
    onPressChange,
    onPress,
    isDisabled,
    ref
  });

  let {focusableProps} = useFocusable(props, ref);
  console.log('focus from button', focusableProps)
  let handlers = mergeProps(pressProps, focusableProps);
  console.log('handlers', handlers)
  // Here is where the props from DOMPropsContext will be added in via mergeProps
      // same thing in all other component aria hooks that can be hovered over, pressed or focused for a tooltip. So pretty much all of them!

  // useHoverable props and see if that makes the warning go away?
  // or
  // useDOMPropsResponderContext ?

  // what is the goal? The goal is -> you need the hover props right here

  let hoverContextProps = useContext(DOMPropsResponderContext);
  console.log('from context', hoverContextProps)

  let interactions = mergeProps(hoverContextProps, handlers);
  console.log('interactions', interactions)

  return {
    isPressed, // Used to indicate press state for visual
    buttonProps: mergeProps(interactions, {
      'aria-haspopup': ariaHasPopup,
      'aria-expanded': ariaExpanded || (ariaHasPopup && isSelected),
      'aria-invalid': validationState === 'invalid' ? true : null,
      disabled: isDisabled,
      type,
      ...(additionalProps || {}),
      onClick: (e) => {
        if (deprecatedOnClick) {
          deprecatedOnClick(e);
          console.warn('onClick is deprecated, please use onPress');
        }
      }
    })
  };
}
