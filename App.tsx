import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Button, View } from 'react-native'
import { NavigationContainer, useNavigation, useRoute, type ParamListBase } from '@react-navigation/native'
import { createNativeStackNavigator, type NativeStackNavigationProp } from '@react-navigation/native-stack'
import axios from 'axios'
import MapView, { Polygon } from 'react-native-maps'

import {
  type Farms,
  type Orchards,
  type Orchs,
  type FarmsRouteParams
} from './types'

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
      const response = await axios.get<Farms>(`${baseUrl}/farms/`, {
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
              farmID: farm.id
            })
          }}
        />
      ))}
    </View>
  )
}

// Re-format a farm's orchards' polygon coordinates
const calculatePolygon = (orchards: Orchards, farmID: number) => {
  const orchs = orchards.results.filter((obj) => obj.farm_id === farmID)
  const polygons: Orchs[] = orchs.map((orch) => {
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

  return polygons
}

// Return the region to display
function calculateRegion (orchs: Orchs[]) {
  if (orchs.length === 0) {
    return null
  }
  let maxLat: number = Number.NEGATIVE_INFINITY
  let maxLong: number = Number.NEGATIVE_INFINITY
  let minLat: number = Number.POSITIVE_INFINITY
  let minLong: number = Number.POSITIVE_INFINITY

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
  const route = useRoute<FarmsRouteParams>()
  const [polys, setPolys] = useState<Orchs[]>([])

  const farmid = route.params.farmID

  useEffect(() => {
    const loadOrchards = async () => {
      const response = await axios.get<Orchards>(`${baseUrl}/orchards/`, {
        headers: {
          Authorization: `${token}`
        }
      })
      setPolys(calculatePolygon(response.data, farmid))
    }
    loadOrchards()
  }, [])

  const region = useMemo(() => calculateRegion(polys), [polys])

  useEffect(() => {
    if (region != null) {
      mapRef.current?.animateToRegion(region, 700)
    }
  }, [region])

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
      <Stack.Navigator initialRouteName="HomeScreen">
        <Stack.Screen name="HomeScreen" component={HomeScreen} />
        <Stack.Screen name="FarmListScreen" component={FarmListScreen} />
        <Stack.Screen name="ViewFarmScreen" component={ViewFarmScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default App
