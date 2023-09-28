/* eslint-disable no-trailing-spaces */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Button, View } from 'react-native'
import { NavigationContainer, useNavigation, useRoute, type ParamListBase } from '@react-navigation/native'
import { createNativeStackNavigator, type NativeStackNavigationProp } from '@react-navigation/native-stack'
import axios from 'axios'
import MapView, { Polygon } from 'react-native-maps'
import {
  type Farms,
  type Orchards,
  type Region,
  type Orchs,
  type FarmsRouteParams
} from './interfaces'

const baseUrl = 'https://sherlock.aerobotics.com/developers'
const token = process.env.EXPO_PUBLIC_API_TOKEN

const HomeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>()
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Button
        title="See Farms"
        onPress={() => { navigation.navigate('FarmListScreen') }}
      />
    </View>
  )
}

const FarmListScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>()
  const [farms, setFarms] = useState<Farms>({
    count: 0,
    next: '',
    previous: '',
    results: []
  })

  useEffect(() => {
    const loadFarms = async () => {
      const response = await axios.get(`${baseUrl}/farms/`, {
        headers: {
          Authorization: `${token}`
        }
      })
      setFarms(response.data)
    }

    loadFarms()
  }, [])

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      {farms.results.map((farm) => (
        <Button
          key={farm.name}
          title={farm.name}
          onPress={() => {
            navigation.navigate('ViewFarmScreen', {
              key: farm.id,
              name: '',
              farmID: farm.id
            })
          }}
        />
      ))}
    </View>
  )
}

// Re-format polygons' coordinates
const calculatePolygon = (orchards: Orchards, farmID: number): Orchs[] => {
  const orchs = orchards.results.filter((obj) => obj.farm_id === farmID)

  const polys: Orchs[] = orchs.map((orch) => {
    const orchID = orch.id
    const poly = orch?.polygon
    const polyg: Array<{ latitude: number, longitude: number }> = []
    if (poly !== undefined) {
      const polyArr: string[] = poly.split(' ')

      polyArr.forEach(function (latLng) {
        const lat = latLng.split(',')[1] as unknown as number
        const lng = latLng.split(',')[0] as unknown as number
        polyg.push({
          latitude: lat,
          longitude: lng
        })
      })
    }
    return { coords: polyg, orchID }
  })
  
  return polys
}

// Return the region to display
function calculateRegion (orchs: Orchs[]): Region {
  let maxLat: number = Number.NEGATIVE_INFINITY; let maxLong: number = Number.NEGATIVE_INFINITY
  let minLat: number = Number.POSITIVE_INFINITY; let minLong: number = Number.POSITIVE_INFINITY

  orchs.forEach((orch) => {
    orch.coords.forEach((coord) => {
      maxLat = Math.max(maxLat, coord.latitude)
      maxLong = Math.max(maxLong, coord.longitude)
      minLat = Math.min(minLat, coord.latitude)
      minLong = Math.min(minLong, coord.longitude)
    })
  })

  // Return the average latitude and longitude.
  return {
    latitude: (maxLat + minLat) / 2,
    longitude: (maxLong + minLong) / 2,
    latitudeDelta: (maxLat - minLat) * 5,
    longitudeDelta: (maxLong - minLong) * 5
  }
}

const ViewFarmScreen = () => {
  const mapRef = useRef<MapView>(null)
  const farmid = useRoute<FarmsRouteParams>().params?.farmID // Get farm's ID
  const [polys, setPolys] = useState<Orchs[]>([{
    orchID: 0,
    coords: [{
      latitude: 0,
      longitude: 0
    }]
  }])

  useEffect(() => {
    const loadOrchards = async () => {
      const response = await axios.get(`${baseUrl}/orchards/`, {
        headers: {
          Authorization: `${token}`
        }
      })
      setPolys(calculatePolygon(response.data, farmid))
    }

    loadOrchards()
  }, [])

  const region = useMemo(() => calculateRegion(polys), [polys]) //
  mapRef.current?.animateToRegion(region, 700)

  return (
    <View style={{ flex: 1 }}>
      <MapView
        mapType="satellite"
        ref={mapRef}
        style={{ flex: 1 }}
        provider="google"
        initialRegion={{
          latitude: -30.327,
          longitude: 18.826,
          latitudeDelta: 20,
          longitudeDelta: 20
        }}
      >
        {polys.map((poly) => (
          <Polygon key={poly.orchID} coordinates={poly.coords} fillColor="rbga(0,255,0,0.2)" />
        ))}
      </MapView>
    </View>
  )
}

const Stack = createNativeStackNavigator()

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="HomeScreen" component={HomeScreen} />
        <Stack.Screen name="FarmListScreen" component={FarmListScreen} />
        <Stack.Screen name="ViewFarmScreen" component={ViewFarmScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default App
