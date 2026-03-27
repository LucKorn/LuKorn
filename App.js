import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, FlatList, 
  StatusBar, TextInput, ScrollView, Modal, 
  Vibration, Dimensions 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const lightTheme = {
  isDark: false, bg: '#F2F2F7', card: '#FFFFFF', cardDone: '#D1D1D6',
  primary: '#34495E', accent: '#5D6D7E', textMain: '#333333',
  textTitle: '#FFFFFF', textDim: '#8E8E93', inputBg: '#F0F0F0',
  border: '#EEEEEE', headerBg: '#34495E', headerBorder: '#34495E', finalizarBg: '#34495E'
};

const darkTheme = {
  isDark: true, bg: '#0A0E14', card: '#121922', cardDone: '#0D1117',
  primary: '#244D73', accent: '#5AA9E6', textMain: '#FFFFFF',
  textTitle: '#5AA9E6', textDim: '#7A869A', inputBg: '#0F141B',
  border: '#1B2531', headerBg: '#0A0E14', headerBorder: '#1B2531', finalizarBg: '#0A0E14'
};

export default function App() {
  const [treinoAtivo, setTreinoAtivo] = useState(null);
  const [exercicios, setExercicios] = useState({});
  const [historico, setHistorico] = useState([]);
  const [tela, setTela] = useState('menu');
  const [tempoDescanso, setTempoDescanso] = useState(60);
  const [novoTreinoNome, setNovoTreinoNome] = useState('');
  const [appTitle, setAppTitle] = useState('MEUS TREINOS');
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [timerAtivo, setTimerAtivo] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const timerRef = useRef(null);

  const theme = isDarkTheme ? darkTheme : lightTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  useEffect(() => {
    const load = async () => {
      try {
        const d = await AsyncStorage.getItem('@gym_v54_data');
        const h = await AsyncStorage.getItem('@gym_v54_hist');
        const t = await AsyncStorage.getItem('@gym_v54_desc');
        const title = await AsyncStorage.getItem('@gym_v54_title');
        const darkPref = await AsyncStorage.getItem('@gym_v54_isDark');
        if (d) setExercicios(JSON.parse(d));
        if (h) setHistorico(JSON.parse(h));
        if (t) setTempoDescanso(parseInt(t));
        if (title) setAppTitle(title);
        if (darkPref !== null) setIsDarkTheme(JSON.parse(darkPref));
      } catch (e) { console.log(e); }
    };
    load();
  }, []);

  const save = async (d, h, t, title, isDark) => {
    if (d) await AsyncStorage.setItem('@gym_v54_data', JSON.stringify(d));
    if (h) await AsyncStorage.setItem('@gym_v54_hist', JSON.stringify(h));
    if (t) await AsyncStorage.setItem('@gym_v54_desc', t.toString());
    if (title) await AsyncStorage.setItem('@gym_v54_title', title);
    if (isDark !== undefined) await AsyncStorage.setItem('@gym_v54_isDark', JSON.stringify(isDark));
  };

  const iniciarTimer = (tempo) => {
    setSegundos(tempo); setTimerAtivo(true);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSegundos((p) => {
        if (p <= 1) { clearInterval(timerRef.current); setTimerAtivo(false); Vibration.vibrate(500); return 0; }
        return p - 1;
      });
    }, 1000);
  };

  const finalizarTreino = () => {
    const listaAtual = exercicios[treinoAtivo];
    const volumeEfetivo = listaAtual.reduce((acc, ex) => acc + (ex.feitas * ex.rep * ex.carga), 0);
    const novoHistorico = [{ id: Date.now().toString(), treino: treinoAtivo, volume: volumeEfetivo, data: new Date().toLocaleDateString('pt-BR'), timestamp: new Date().toISOString() }, ...historico];
    const copiaExercicios = { ...exercicios };
    copiaExercicios[treinoAtivo] = listaAtual.map(e => ({ ...e, feitas: 0 }));
    setHistorico(novoHistorico); setExercicios(copiaExercicios); save(copiaExercicios, novoHistorico);
    setTela('menu');
  };

  if (tela === 'treino') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={theme.headerBg} />
        <View style={styles.header}>
            <TouchableOpacity onPress={() => { save(exercicios); setTela('menu'); }}><Text style={styles.backLink}>← Sair</Text></TouchableOpacity>
            <Text style={styles.headerTitle}>{treinoAtivo}</Text>
            <TouchableOpacity onPress={() => {
                const c = {...exercicios}; c[treinoAtivo].push({id: Date.now().toString(), nome: 'Novo Exercicio', series: 3, rep: 10, carga: 0, feitas: 0});
                setExercicios(c);
            }}><Text style={styles.addExBtn}>+ Add</
