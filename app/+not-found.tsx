import * as React from 'react';
import { Href, Link, Stack } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';

import CustomHeader from '@/components/custom-header';


export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{
        title: 'Oops!',
        headerTitle: () => (
          <CustomHeader
            logo='person-circle-outline'
            search={true}
          />
        )
      }} />
      <View style={styles.container}>
        <Text style={styles.title}>
          This screen doesn't exist.
        </Text>

        <Link href={"/select-chapter" as Href<string>} className={'text-white bg-black-200 p-2 rounded-lg my-3'}>
          <Text className='text-sm'>
            Go to home screen!
          </Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
    backgroundColor: '#2e78b7',
  },
  linkText: {
    fontSize: 14,
    color: '#2e78b7',
  },
});
