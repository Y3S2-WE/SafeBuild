import { render, screen } from '@testing-library/react';
import { FormInput } from './FormInput';

describe('FormInput', () => {
  test('renders label, input and error message', () => {
    render(
      <FormInput
        id="email"
        label="Email Address"
        type="email"
        error="Email is required"
      />
    );

    expect(screen.getByText('Email Address')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
    expect(screen.getByText('Email is required')).toBeInTheDocument();
  });

  test('does not render error message when error is empty', () => {
    render(<FormInput id="name" label="Name" />);

    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
  });
});
