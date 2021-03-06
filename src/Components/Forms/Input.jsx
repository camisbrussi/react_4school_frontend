import React from 'react';
import styles from './Input.module.css';

const Input = ({ label, type, name, value, onChange, error, onBlur, checked, onClick, disabled, onKeyUp, defaultChecked  }) => {
  return (
    <div className={styles.wrapper}>
      <label htmlFor={name} className={styles.label}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        className={styles.input}
        type={type}
        value={value}
        onChange={onChange}
        onClick={onClick}
        onBlur={onBlur}
        checked={checked}
        autoComplete="off"
        disabled = {disabled}
        onKeyUp = {onKeyUp}
        defaultChecked={defaultChecked}
      />
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
};

export default Input;