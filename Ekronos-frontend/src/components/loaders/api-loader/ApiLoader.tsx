import styles from './ApiLoader.module.scss';

function ApiLoader() {
  return (
    <div>
      <p className={styles.text}>Connecting...</p>
    </div>
  );
}

export { ApiLoader };
