import { Link } from 'react-router-dom';
import React, { useEffect } from 'react';

import { hooks } from '../hooks';
import { custom } from '../custom';
import { svg } from '../assets/svg';
import { actions } from '../store/actions';
import { components } from '../components';

import background from '../assets/bg/03.png';

export const SignUp: React.FC = () => {
  const dispatch = hooks.useDispatch();

  hooks.useThemeColor('#fff');

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor('#fff'));
  }, []);

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        // showGoBack={true}
        headerStyle={{
          backgroundColor: 'var(--white-color)',
        }}
      />
    );
  };

  const renderContent = (): JSX.Element => {
    return (
      <main className='scrollable'>
        <div
          style={{
            backgroundImage: `url(${background})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            marginTop: 16,
            marginLeft: 20,
            marginRight: 20,
            marginBottom: 20,
            paddingBottom: 20,
            paddingLeft: 20,
            paddingRight: 20,
            paddingTop: '16%',
            borderRadius: 20,
          }}
        >
         
          <h1
            style={{
              textAlign: 'center',
              marginBottom: 16,
              textTransform: 'capitalize',
            }}
          >
            Sign up
          </h1>
          <span
            className='t18'
            style={{ textAlign: 'center', display: 'block', marginBottom: 30 }}
          >
            Use social networks or your email
          </span>
          <custom.InputField
            containerStyle={{ marginBottom: 16 }}
            placeholder='Enter your name'
          />
          <custom.InputField
            containerStyle={{ marginBottom: 16 }}
            placeholder='Enter your email'
          />
          <custom.InputField
            containerStyle={{ marginBottom: 16 }}
            placeholder='Enter your password'
            icon={<svg.CheckSvg />}
          />
          <custom.InputField
            containerStyle={{ marginBottom: 16 }}
            placeholder='Confirm your password'
            icon={<svg.EyeOffSvg />}
          />
          <components.Button
            text='Sign Up'
            to='/'
            containerStyle={{ marginBottom: 24 }}
          />
          <div
            className='t18'
            style={{ textAlign: 'center' }}
          >
            Already have an account?{' '}
            <Link
              to='/'
              style={{ color: 'var(--main-color)' }}
            >
              Sign in.
            </Link>{' '}
          </div>
        </div>
      </main>
    );
  };

  return (
    <>
      {renderHeader()}
      {renderContent()}
    </>
  );
};
