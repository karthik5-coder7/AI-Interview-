import { AppRegistry } from 'react-native';
import App from './App';

const appName = 'AIInterviewApp';

AppRegistry.registerComponent(appName, () => App);

const rootTag = document.getElementById('root');

AppRegistry.runApplication(appName, {
  rootTag,
});
