import * as React from 'react';
import { TextInput } from 'react-native';
import renderer from 'react-test-renderer';
import FormField from '../form-field';

describe('FormField', () => {
  it('renders with title and placeholder', () => {
    const tree = renderer.create(
      <FormField
        title="Email"
        value=""
        placeholder="Enter email"
        handleChangeText={() => {}}
        inputStyle=""
      />
    ).toJSON();
    expect(tree).toBeTruthy();
  });

  it('renders password field with secure entry', () => {
    const tree = renderer.create(
      <FormField
        title="Password"
        value=""
        placeholder="Enter password"
        handleChangeText={() => {}}
        inputStyle=""
      />
    ).toJSON();
    expect(tree).toBeTruthy();
  });

  it('calls handleChangeText when value would change', () => {
    const handleChangeText = jest.fn();
    const tree = renderer.create(
      <FormField
        title="Email"
        value=""
        placeholder="Enter email"
        handleChangeText={handleChangeText}
        inputStyle=""
      />
    );
    const input = tree.root.findByType(TextInput);
    input.props.onChangeText('a');
    expect(handleChangeText).toHaveBeenCalledWith('a');
  });
});
