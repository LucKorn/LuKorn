import React, { useState, useEffect, useRef } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useKeepAwake } from 'expo-keep-awake'; 
import { 
  StyleSheet, Text, View, TouchableOpacity, FlatList, 
  TextInput, ScrollView, Modal, Vibration, Dimensions, SafeAreaView 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

SplashScreen.preventAutoHideAsync();

export default function App() {
  useKeepAwake(); // Mantém a tela acesa para o cronômetro não parar

  const [appPronto, setAppPronto] = useState(false);
  const [tempoDescanso, setTempoDescanso] = useState(180); // Padrão do seu print
  const [exercicios, setExercicios] = useState({});
  const [timerAtivo, setTimerAtivo] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const d = await AsyncStorage.getItem('@gym_data_v1');
        if (d) setExercicios(JSON.parse(d));
      } finally {
        setAppPronto(true);
        await SplashScreen.hideAsync();
      }
    };
    load();
  }, []);

  const iniciarTimer = () => {
    setSegundos(tempoDescanso);
    setTimerAtivo(true);
    timerRef.current = setInterval(() => {
      setSegundos(p => {
        if (p <= 1) { clearInterval(timerRef.current); setTimerAtivo(false); return 0; }
        return p - 1;
      });
    }, 1000);
  };

  if (!appPronto) return null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.headerTitle}>TREINO RCHOP</Text>

        <View style={styles.stepperContainer}>
          <Text style={styles.stepperLabel}>DESCANSO PADRÃO</Text>
          <View style={styles.stepperControls}>
            <TouchableOpacity onPress={() => setTempoDescanso(p => Math.max(10, p - 10))}>
              <Text style={styles.stepperBtn}>-</Text>
            </TouchableOpacity>
            <Text style={styles.stepperValue}>{tempoDescanso}s</Text>
            <TouchableOpacity onPress={() => setTempoDescanso(p => p + 10)}>
              <Text style={styles.stepperBtn}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {Object.keys(exercicios).map((item, index) => (
          <View key={index} style={styles.cardTreino}>
            <Text style={styles.treinoNome}>{item}</Text>
            <TouchableOpacity onPress={iniciarTimer}>
              <Text style={{ fontSize: 24 }}>▶️</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <Modal visible={timerAtivo} transparent>
        <View style={styles.modalOverlay}>
          <Text style={styles.timerTexto}>{segundos}s</Text>
          <TouchableOpacity style={styles.btnFechar} onPress={() => { setTimerAtivo(false); clearInterval(timerRef.current); }}>
            <Text style={{ color: '#FFF' }}>PARAR</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  headerTitle: { fontSize: 28, fontWeight: '900', textAlign: 'center', marginVertical: 30 },
  stepperContainer: { backgroundColor: '#FFF', padding: 15, borderRadius: 15, alignItems: 'center', marginBottom: 25 },
  stepperLabel: { fontSize: 12, color: '#8E8E93' },
  stepperControls: { flexDirection: 'row', alignItems: 'center' },
  stepperBtn: { fontSize: 35, color: '#3A506B', paddingHorizontal: 25 },
  stepperValue: { fontSize: 32, fontWeight: '800' },
  cardTreino: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: 20, 
    backgroundColor: '#FFF',
    borderRadius: 12, 
    marginBottom: 15,
    borderLeftWidth: 8, // Bordinha azul lateral
    borderLeftColor: '#007AFF', // Cor azul de destaque
    elevation: 3 
  },
  treinoNome: { fontSize: 18, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  timerTexto: { fontSize: 80, color: '#FFF', fontWeight: 'bold' },
  btnFechar: { marginTop: 20, backgroundColor: '#FF4D4F', padding: 15, borderRadius: 10 }
});
