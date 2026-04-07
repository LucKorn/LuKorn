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
  useKeepAwake(); 

  const [appPronto, setAppPronto] = useState(false);
  const [tema, setTema] = useState('light');
  const [tela, setTela] = useState('menu'); 
  const [treinoSelecionado, setTreinoSelecionado] = useState(null);
  const [exercicios, setExercicios] = useState({});
  const [tempoDescanso, setTempoDescanso] = useState(180);

  // --- ESTADOS DE INPUT COM NÚMEROS ---
  const [novoExNome, setNovoExNome] = useState('');
  const [series, setSeries] = useState(3);
  const [reps, setReps] = useState(12);
  const [carga, setCarga] = useState(10); // Novo campo de carga

  const [timerAtivo, setTimerAtivo] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const timerRef = useRef(null);

  const Cores = {
    bg: tema === 'light' ? '#F2F2F7' : '#0A0A0A',
    card: tema === 'light' ? '#FFFFFF' : '#1C1C1E',
    texto: tema === 'light' ? '#1C1C1E' : '#FFFFFF',
    azul: '#007AFF',
    sub: '#8E8E93'
  };

  const isExercicioTempo = (nome) => nome.toLowerCase().includes('prancha') || nome.toLowerCase().includes('isometria');

  // ... (useEffect de load e função save seguem a mesma lógica anterior)

  const adicionarExercicio = () => {
    if (novoExNome.trim() === '') return;
    const novos = { ...exercicios };
    novos[treinoSelecionado].push({
      id: Date.now().toString(),
      nome: novoExNome,
      series: series,
      reps: reps,
      carga: carga,
      isTempo: isExercicioTempo(novoExNome)
    });
    setExercicios(novos);
    setNovoExNome(''); setSeries(3); setReps(12); setCarga(10);
    // save(novos...);
  };

  // Componente de Controle +/- 
  const SeletorAjuste = ({ label, valor, setValor, unidade = "" }) => (
    <View style={styles.seletorContainer}>
      <Text style={[styles.seletorLabel, { color: Cores.sub }]}>{label}</Text>
      <View style={styles.seletorControls}>
        <TouchableOpacity style={styles.btnAjuste} onPress={() => setValor(Math.max(0, valor - 1))}>
          <Text style={styles.btnAjusteTexto}>-</Text>
        </TouchableOpacity>
        <Text style={[styles.valorTexto, { color: Cores.texto }]}>{valor}{unidade}</Text>
        <TouchableOpacity style={styles.btnAjuste} onPress={() => setValor(valor + 1)}>
          <Text style={styles.btnAjusteTexto}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (tela === 'detalhes') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Cores.bg }]}>
        <View style={{ padding: 20, flex: 1 }}>
          <TouchableOpacity onPress={() => setTela('menu')}><Text style={{ color: Cores.azul, fontWeight: 'bold' }}>← Voltar</Text></TouchableOpacity>
          
          <FlatList
            data={exercicios[treinoSelecionado]}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={[styles.cardEx, { backgroundColor: Cores.card }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.exNome, { color: Cores.texto }]}>{item.nome}</Text>
                  <Text style={{ color: Cores.sub }}>{item.series} x {item.reps}{item.isTempo ? 's' : ''} • {item.carga}kg</Text>
                </View>
                <TouchableOpacity onPress={() => {/* iniciar timer */}}><Text style={{ fontSize: 24 }}>▶️</Text></TouchableOpacity>
              </View>
            )}
          />

          {/* ÁREA DE ADICIONAR COM SELETORES */}
          <View style={[styles.areaAdd, { backgroundColor: Cores.card }]}>
            <TextInput 
              style={[styles.input, { color: Cores.texto, borderBottomColor: Cores.bg, borderBottomWidth: 1 }]} 
              placeholder="Nome do Exercício" placeholderTextColor={Cores.sub}
              value={novoExNome} onChangeText={setNovoExNome}
            />
            <View style={styles.linhaSeletores}>
              <SeletorAjuste label="Séries" valor={series} setValor={setSeries} />
              <SeletorAjuste 
                label={isExercicioTempo(novoExNome) ? "Segundos" : "Reps"} 
                valor={reps} setValor={setReps} 
                unidade={isExercicioTempo(novoExNome) ? "s" : ""}
              />
              <SeletorAjuste label="Carga" valor={carga} setValor={setCarga} unidade="kg" />
            </View>
            <TouchableOpacity style={styles.btnAddFinal} onPress={adicionarExercicio}>
              <Text style={{ color: '#FFF', fontWeight: 'bold' }}>SALVAR EXERCÍCIO</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Cores.bg }]}>
      {/* Menu Principal igual ao anterior */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  cardEx: { flexDirection: 'row', padding: 18, borderRadius: 12, marginBottom: 10, borderLeftWidth: 8, borderLeftColor: '#007AFF', elevation: 2 },
  exNome: { fontSize: 17, fontWeight: '700' },
  areaAdd: { padding: 15, borderRadius: 20, marginTop: 10 },
  input: { padding: 10, fontSize: 18, marginBottom: 15 },
  linhaSeletores: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  seletorContainer: { alignItems: 'center', width: '30%' },
  seletorLabel: { fontSize: 10, fontWeight: 'bold', marginBottom: 5, textTransform: 'uppercase' },
  seletorControls: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F2F2F7', borderRadius: 10, padding: 5 },
  btnAjuste: { paddingHorizontal: 10 },
  btnAjusteTexto: { fontSize: 20, color: '#007AFF', fontWeight: 'bold' },
  valorTexto: { fontSize: 16, fontWeight: 'bold', minWidth: 30, textAlign: 'center' },
  btnAddFinal: { backgroundColor: '#007AFF', padding: 15, borderRadius: 12, alignItems: 'center' }
});
