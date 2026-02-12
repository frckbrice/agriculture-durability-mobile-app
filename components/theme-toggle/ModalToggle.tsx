import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { cn } from '../../lib/utils';
import * as React from 'react';
import { CircleUserRoundIcon } from 'lucide-react-native';

export function ModalToggle() {
  return (
    <Pressable
      onPress={() => {
        router.push('/modal');
      }}
      className='web:ring-offset-background web:transition-colors web:focus-visible:outline-none web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2'
    >
      {({ pressed }) => (
        <View
          className={cn(
            'flex-1 aspect-square justify-center items-end pt-0.5 web:pl-4',
            pressed && 'opacity-70'
          )}
        >
          <CircleUserRoundIcon className='text-foreground' size={24} strokeWidth={1.25} />
        </View>
      )}
    </Pressable>
  );
}
