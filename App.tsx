import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button, View, Text, StyleSheet } from 'react-native';
import { NavigationContainer, useRoute } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Constants from 'expo-constants'
import axios, { AxiosResponse } from 'axios';// from 'axios';
import MapView, {Polygon} from 'react-native-maps';
import { Farms, Farm, ButtonProps, Orchard, Orchards, FarmsRouteParams, Region } from './interfaces';

const baseUrl:string='https://sherlock.aerobotics.com/developers'
const token:string=''

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

function HomeScreen({ navigation }:{navigation: any}) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Button
        title='See Farms'
        onPress={()=>navigation.navigate('farmsList')}
      />
    </View>
  );
}

function FarmListScreen({ navigation }:{navigation: any}) {

  const [farms,setFarms]=useState<Farms>({
    count:0,
    next:'',
    previous:'',
    results:[]
  });

  useEffect(()=>{
    const loadFarms = async() => {
      const response = await axios.get(`${baseUrl}/farms/`, 
      {
        headers: {
          Authorization:`${token}`,
        },
    })
    setFarms(response.data);
    }

  loadFarms();
},[])

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      {farms.results.map((farm) => (
        <Button 
          key={farm.name} 
          title={farm.name} 
          onPress={() => {
            navigation.navigate('viewFarm', {
            key:farm.id,
            name:'',
            farmID: farm.id})}} />
      ))}
    </View>
  );
}

// Return array containing orchard's polygon object(s)
function calculatePolygon(orchards:Orchards,farmid:number):{latitude:number; longitude:number}[][] {
  const orchs = orchards.results.filter((obj) => obj.farm_id === farmid);

  let polys:{latitude:number; longitude:number}[][] = orchs.map((orch)=>{
    let orch_id:number = orch.id;
    let poly=orch?.polygon;
    const polygon:{latitude:number; longitude:number}[]=[];
    if (poly !== undefined){
      let polyArr:string[]=poly.split(' ');
  
      polyArr.forEach(function (latLng){
        let lat=(latLng.split(',')[1] as unknown as number);
        let lng=(latLng.split(',')[0] as unknown as number);
        polygon.push({
          latitude:lat, longitude:lng
        });
      })
    }
    return polygon;
  })
  console.log(JSON.stringify(polys))
  return polys
}



// Return the region to display on the app
function calculateRegion(polygon:{latitude:number; longitude:number}[]):Region{
  //console.debug("Calculate")
  const sumLatitude = polygon.reduce((sum, currentObject) => sum + Number(currentObject.latitude), 0);
  const sumLongitude = polygon.reduce((sum, currentObject) => sum + Number(currentObject.longitude), 0);
  
  const minLatitude = polygon.reduce((min, currentObject) => Math.min(min, Number(currentObject.latitude)), Number.POSITIVE_INFINITY);
  const maxLatitude = polygon.reduce((max, currentObject) => Math.max(max, Number(currentObject.latitude)), Number.NEGATIVE_INFINITY);
  const minLongitude = polygon.reduce((min, currentObject) => Math.min(min, Number(currentObject.longitude)), Number.POSITIVE_INFINITY);
  const maxLongitude = polygon.reduce((max, currentObject) => Math.max(max, Number(currentObject.longitude)), Number.NEGATIVE_INFINITY);

  const latDelta = (maxLatitude - minLatitude)*1.2;
  const lngDelta= (maxLongitude - minLongitude)*1.2;

  // Calculate the average latitude and longitude.
  const averageLatitude = sumLatitude / polygon.length;
  const averageLongitude = sumLongitude / polygon.length;

  // Return the average latitude and longitude.
  return {
    latitude: averageLatitude,
    longitude: averageLongitude,
    latitudeDelta: latDelta,
    longitudeDelta:lngDelta,
  };
}

function ViewFarmScreen({ route, navigation }:{route:any,navigation:any}){

  const mapRef=useRef<MapView>(null);

  const farmid=route.params.farmID; // Get farm's ID
  const [polys,setPolys]=useState<{ latitude: number; longitude: number; }[][]>([[]]);

  useEffect(()=>{
    const loadOrchards = async() => {
      const response = await axios.get(`${baseUrl}/orchards/`, 
      {
        headers: {
          Authorization:`${token}`,
        },
      })
      setPolys(calculatePolygon(response.data,farmid));
      
    }
    
    loadOrchards();
     
  },[])

  const region = useMemo(() => calculateRegion(polys[0]),[polys])
  mapRef.current?.animateToRegion(region,2000);

  return (
    <View style={styles.container}>
        <MapView
          mapType='satellite'
          ref={mapRef}
          style={{ flex: 1 }}
          provider="google"
          initialRegion={{
            latitude: -30.327,
            longitude: 18.826,
            latitudeDelta: 20,
            longitudeDelta: 20,
          }} 
          >
            {polys.map((poly)=>
              <Polygon coordinates={poly} fillColor="rbga(0,255,0,0.2)"/>)}
        </MapView>
      </View>
  );
}

const Stack = createNativeStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="home" component={HomeScreen} />
        <Stack.Screen name="farmsList" component={FarmListScreen} />
        <Stack.Screen name='viewFarm' component={ViewFarmScreen}/>
      </Stack.Navigator>
    </NavigationContainer>
  );

}

export default App;