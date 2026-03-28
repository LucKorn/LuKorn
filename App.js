import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [tela, setTela] = useState('menu');
  const [treinoAtivo, setTreinoAtivo] = useState(null);
  const [exercicios, setExercicios] = useState({
    'Treino A': [],
    'Treino B': [],
    'Treino C': []
  });
  const [segundos, setSegundos] = useState(0);
  const [timerAtivo, setTimerAtivo] = useState(false);
  const timerRef = useRef(null);

  // Inicia o timer de descanso
  const iniciarTimer = (tempo) => {
    setSegundos(tempo);
    setTimerAtivo(true);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSegundos((p) => {
        if (p <= 1) {
          clearInterval(timerRef.current);
          setTimerAtivo(false);
          return 0;
        }
        return p - 1;
      });
    }, 1000);
  };

  // Salva os dados no celular
  const salvarDados = async (novosDados) => {
    try {
      await AsyncStorage.setItem('@gym_v43_data', JSON.stringify(novosDados));
    } catch (e) {
      console.log("Erro ao salvar");
    }
  };

  // Renderização da tela de Treino
  if (tela === 'treino') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0E14" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setTela('menu')}>
            <Text style={styles.headerTitle}>← {treinoAtivo}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {
            const c = { ...exercicios };
            c[treinoAtivo].push({ nome: '', carga: '' });
            setExercicios(c);
            salvarDados(c);
          }}>
            <Text style={styles.addExBtn}>+ Add</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.lista}>
          {exercicios[treinoAtivo].map((ex, index) => (
            <View key={index} style={styles.card}>
              <TextInput
                style={styles.inputNome}
                placeholder="Exercício"
                placeholderTextColor="#666"
                value={ex.nome}
                onChangeText={(t) => {
                  const c = { ...exercicios };
                  c[treinoAtivo][index].nome = t;
                  setExercicios(c);
                }}
              />
              <TextInput
                style={styles.inputCarga}
                placeholder="Carga (kg)"
                placeholderTextColor="#666"
                keyboardType="numeric"
                value={ex.carga}
                onChangeText={(t) => {
                  const c = { ...exercicios };
                  c[treinoAtivo][index].carga = t;
                  setExercicios(c);
                }}
              />
              <TouchableOpacity onPress={() => iniciarTimer(60)} style={styles.timerBtn}>
                <Text style={styles.timerText}>⏱️ 60s</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        {timerAtivo && (
          <View style={styles.timerFlutuante}>
            <Text style={styles.timerFlutuanteText}>Descanso: {segundos}s</Text>
          </View>
        )}
      </View>
    );
  }

  // Tela de Menu Principal
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0E14" />
      <Text style={styles.tituloPrincipal}>MEUS TREINOS V43</Text>
      {Object.keys(exercicios).map((t) => (
        <TouchableOpacity 
          key={t} 
          style={styles.btnMenu} 
          onPress={() => { setTreinoAtivo(t); setTela('treino'); }}
        >
          <Text style={styles.btnMenuText}>{t}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0E14', padding: 20, paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  headerTitle: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  addExBtn: { color: '#00FF00', fontSize: 18, fontWeight: 'bold' },
  tituloPrincipal: { color: '#FFF', fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 40 },
  btnMenu: { backgroundColor: '#1A1F26', padding: 20, borderRadius: 10, marginBottom: 15 },
  btnMenuText: { color: '#FFF', fontSize: 20, textAlign: 'center' },
  lista: { flex: 1 },
  card: { backgroundColor: '#1A1F26', padding: 15, borderRadius: 10, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  inputNome: { color: '#FFF', flex: 2, fontSize: 16 },
  inputCarga: { color: '#00FF00', flex: 1, fontSize: 16, textAlign: 'center', fontWeight: 'bold' },
  timerBtn: { backgroundColor: '#333', padding: 8, borderRadius: 5 },
  timerText: { color: '#FFF', fontSize: 12 },
  timerFlutuante: { position: 'absolute', bottom: 30, alignSelf: 'center', backgroundColor: '#00FF00', padding: 15, borderRadius: 30 },
  timerFlutuanteText: { color: '#000', fontWeight: 'bold' }
});
