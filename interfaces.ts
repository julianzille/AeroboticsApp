import StyleSheet from 'react-native'
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer, useRoute } from '@react-navigation/native';

export interface Farms {
    count:number;
    next:string;
    previous:string;
    results: Farm[];
  }
  
  export interface Farm {
    id: number;
    name:string;
    client_id:number;
  }
  
  export interface ButtonProps {
    title: string;
    onPress: () => void;
  }

export interface Orchards {
    count:number;
    next:string;
    previous:string;
    results: Orchard[];
}

export interface Orchard {
    id:number;
    hectares:number;
    name:string;
    farm_id:number;
    client_id:number;
    polygon:string;
    crop_type: string
}

export interface FarmsRouteParams {
    key:'';
    name:'';
    farmID:number;
    params:any;
}

export interface Region {
  latitude: number,
  longitude: number,
  latitudeDelta: number,
  longitudeDelta: number,
}

