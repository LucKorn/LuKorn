import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, FlatList, 
  TextInput, ScrollView, Modal, Vibration, Dimensions, SafeAreaView 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function App() {
  const [tema, setTema] = useState('dark');
  const [treinoAtivo, setTreinoAtivo] = useState(null);
  const [exercicios, setExercicios] = useState({});
  const [historico, setHistorico] = useState([]);
  const [tela, setTela] = useState('menu');
  const [tempoDescanso, setTempoDescanso] = useState(60);
  const [novoTreinoNome, setNovoTreinoNome] = useState('');
  const [appTitle, setAppTitle] = useState('MEUS TREINOS');
  const [mesAtual, setMesAtual] = useState(new Date());

  const [timerAtivo, setTimerAtivo] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const timerRef = useRef(null);

  const Cores = {
    bg: tema === 'light' ? '#F2F2F7' : '#0A0A0A',
    card: tema === 'light' ? '#FFFFFF' : '#1C1C1E',
    headerBorder: tema === 'light' ? '#D1D1D6' : '#2C2C2E',
    texto: tema === 'light' ? '#1C1C1E' : '#FFFFFF',
    destaque: '#3A506B', 
    sub: '#8E8E93',
    borda: tema === 'light' ? '#D1D1D6' : '#2C2C2E',
    stepperBg: tema === 'light' ? '#F0F0F0' : '#2C2C2E',
    danger: '#FF4D4F'
  };

  useEffect(() => {
    const load = async () => {
      try {
        const d = await AsyncStorage.getItem('@gym_v54_data');
        const h = await AsyncStorage.getItem('@gym_v54_hist');
        const t = await AsyncStorage.getItem('@gym_v54_desc');
        const title = await AsyncStorage.getItem('@gym_v54_title');
        const savedTheme = await AsyncStorage.getItem('@gym_v54_theme');
        if (d) setExercicios(JSON.parse(d));
        if (h) setHistorico(JSON.parse(h));
        if (t) setTempoDescanso(parseInt(t));
        if (title) setAppTitle(title);
        if (savedTheme) setTema(savedTheme);
      } catch (e) { console.log(e); }
    };
    load();
  }, []);

  const save = async (d, h, t, title, th) => {
    if (d) await AsyncStorage.setItem('@gym_v54_data', JSON.stringify(d));
    if (h) await AsyncStorage.setItem('@gym_v54_hist', JSON.stringify(h));
    if (t) await AsyncStorage.setItem('@gym_v54_desc', t.toString());
    if (title) await AsyncStorage.setItem('@gym_v54_title', title);
    if (th) await AsyncStorage.setItem('@gym_v54_theme', th);
  };

  const rodarTimer = (t) => {
    setSegundos(t); setTimerAtivo(true);
    if(timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setSegundos(s => {
      if(s <= 1){ clearInterval(timerRef.current); setTimerAtivo(false); Vibration.vibrate(500); return 0; }
      return s - 1;
    }), 1000);
  };

  const finalizarTreino = () => {
    const listaAtual = exercicios[treinoAtivo];
    const volume = listaAtual.reduce((a, e) => a + (e.feitas * e.rep * e.carga), 0);
    const agora = new Date();
    
    // 1. REORDENAR EXERCÍCIOS: Quem foi feito vai pro fim
    const pendentes = listaAtual.filter(e => e.feitas === 0);
    const concluidos = listaAtual.filter(e => e.feitas > 0).map(e => ({...e, feitas: 0}));
    const novaListaEx = [...pendentes, ...concluidos];

    const nH = [{ 
      id: Date.now().toString(), 
      treino: treinoAtivo, 
      volume, 
      dataStr: agora.toLocaleDateString('pt-BR'), 
      timestamp: agora.getTime() 
    }, ...historico];

    // 2. REORDENAR MENU: Move o treino para o fim da fila
    const copiaOriginal = { ...exercicios };
    const nomesOutrosTreinos = Object.keys(copiaOriginal).filter(nome => nome !== treinoAtivo);
    
    const novosEx = {};
    // Primeiro adiciona os outros treinos
    nomesOutrosTreinos.forEach(nome => {
      novosEx[nome] = copiaOriginal[nome];
    });
    // Por último, adiciona o treino que acabou de ser feito (já com os exercícios reordenados)
    novosEx[treinoAtivo] = novaListaEx;

    setHistorico(nH); 
    setExercicios(novosEx);
    save(novosEx, nH); 
    setTela('menu');
    Vibration.vibrate(200);
  };

  const Stepper = ({ label, val, onMin, onAdd }) => (
    <View style={{alignItems: 'center', flex: 1}}>
      <Text style={[styles.stepLabel, {color: Cores.sub}]}>{label}</Text>
      <View style={[styles.stepRow, {backgroundColor: Cores.stepperBg}]}>
        <TouchableOpacity onPress={onMin}><Text style={[styles.stepBtn, {color: Cores.texto}]}>-</Text></TouchableOpacity>
        <Text style={[styles.stepValCard, {color: Cores.texto}]}>{val}</Text>
        <TouchableOpacity onPress={onAdd}><Text style={[styles.stepBtn, {color: Cores.texto}]}>+</Text></TouchableOpacity>
      </View>
    </View>
  );

  if (tela === 'historico') {
    const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const umaSemanaAtras = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const totalSemana = historico.filter(h => h.timestamp > umaSemanaAtras).reduce((acc, curr) => acc + curr.volume, 0);
    const filtrado = historico.filter(h => {
      const d = new Date(h.timestamp || Date.now());
      return d.getMonth() === mesAtual.getMonth() && d.getFullYear() === mesAtual.getFullYear();
    });
    const totalMes = filtrado.reduce((acc, curr) => acc + curr.volume, 0);

    return (
      <SafeAreaView style={[styles.container, {backgroundColor: Cores.bg}]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setTela('menu')}><Text style={[styles.backLink, {color: Cores.texto}]}>◀</Text></TouchableOpacity>
          <Text style={[styles.headerTitle, {color: Cores.texto}]}>HISTÓRICO</Text>
          <TouchableOpacity onPress={() => { setHistorico([]); save(null, []); }}><Text style={{color: Cores.danger, paddingRight: 20, fontWeight: 'bold'}}>LIMPAR</Text></TouchableOpacity>
        </View>
        <View style={styles.mesSelector}>
          <TouchableOpacity onPress={() => { const n = new Date(mesAtual.setMonth(mesAtual.getMonth() - 1)); setMesAtual(new Date(n)); }}><Text style={{color: Cores.destaque, fontSize: 24}}>◀</Text></TouchableOpacity>
          <Text style={{color: Cores.texto, fontWeight: 'bold', fontSize: 18}}>{meses[mesAtual.getMonth()]} {mesAtual.getFullYear()}</Text>
          <TouchableOpacity onPress={() => { const n = new Date(mesAtual.setMonth(mesAtual.getMonth() + 1)); setMesAtual(new Date(n)); }}><Text style={{color: Cores.destaque, fontSize: 24}}>▶</Text></TouchableOpacity>
        </View>
        <View style={styles.resumoContainer}>
            <View style={[styles.resumoCard, {backgroundColor: Cores.card}]}><Text style={{color: Cores.sub, fontSize: 10, fontWeight: '900'}}>ESTA SEMANA</Text><Text style={{color: Cores.destaque, fontSize: 16, fontWeight: 'bold'}}>{totalSemana} kg</Text></View>
            <View style={[styles.resumoCard, {backgroundColor: Cores.card}]}><Text style={{color: Cores.sub, fontSize: 10, fontWeight: '900'}}>TOTAL NO MÊS</Text><Text style={{color: Cores.destaque, fontSize: 16, fontWeight: 'bold'}}>{totalMes} kg</Text></View>
        </View>
        <FlatList data={filtrado} contentContainerStyle={{padding: 15}} renderItem={({item}) => (
          <View style={[styles.menuItem, {backgroundColor: Cores.card, marginBottom: 10}]}>
            <View><Text style={[styles.menuItemTxt, {color: Cores.texto}]}>{item.treino}</Text><Text style={{color: Cores.sub, fontSize: 12}}>{item.dataStr}</Text></View>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 15}}>
                <Text style={{color: Cores.destaque, fontWeight: 'bold'}}>{item.volume} kg</Text>
                <TouchableOpacity onPress={() => { const nH = historico.filter(h => h.id !== item.id); setHistorico(nH); save(null, nH); }}><Text style={{fontSize: 18}}>🗑️</Text></TouchableOpacity>
            </View>
          </View>
        )} />
      </SafeAreaView>
    );
  }

  if (tela === 'treino') {
    return (
      <SafeAreaView style={[styles.container, {backgroundColor: Cores.bg}]}>
        <View style={[styles.header, {borderBottomWidth: 1, borderColor: Cores.headerBorder}]}>
          <TouchableOpacity onPress={() => setTela('menu')}><Text style={[styles.backLink, {color: Cores.texto}]}>◀</Text></TouchableOpacity>
          <Text style={[styles.headerTitle, {color: Cores.texto}]}>{treinoAtivo}</Text>
          <TouchableOpacity onPress={() => {
              const c = {...exercicios}; c[treinoAtivo].push({id: Date.now().toString(), nome: 'Novo', series: 3, rep: 10, carga: 0, feitas: 0});
              setExercicios(c); save(c);
          }}><Text style={[styles.addExBtn, {color: Cores.texto}]}>+ EX</Text></TouchableOpacity>
        </View>
        <FlatList data={exercicios[treinoAtivo]} contentContainerStyle={{padding: 15, paddingBottom: 100}} renderItem={({item}) => {
            const concluido = item.feitas >= item.series;
            const isPrancha = item.nome.toLowerCase().includes('prancha');
            const updateEx = (k, v) => {
                const nl = [...exercicios[treinoAtivo]]; const i = nl.findIndex(e => e.id === item.id); nl[i][k] = v;
                const c = {...exercicios}; c[treinoAtivo] = nl; setExercicios(c);
            };
            return (
              <View style={styles.treinoRow}>
                <View style={[styles.card, {backgroundColor: Cores.card, opacity: concluido ? 0.4 : 1}]}>
                  <View style={styles.cardHeader}>
                    <View style={{flexDirection: 'row', gap: 15, alignItems: 'center'}}>
                        <TouchableOpacity onPress={() => { const nl = [...exercicios[treinoAtivo]]; const i = nl.findIndex(e => e.id === item.id); if (i > 0) { [nl[i], nl[i-1]] = [nl[i-1], nl[i]]; const c = {...exercicios}; c[treinoAtivo] = nl; setExercicios(c); save(c); }}}><Text style={{color: Cores.sub, fontSize: 22}}>▲</Text></TouchableOpacity>
                        <TouchableOpacity onPress={() => { const nl = [...exercicios[treinoAtivo]]; const i = nl.findIndex(e => e.id === item.id); if (i < nl.length - 1) { [nl[i], nl[i+1]] = [nl[i+1], nl[i]]; const c = {...exercicios}; c[treinoAtivo] = nl; setExercicios(c); save(c); }}}><Text style={{color: Cores.sub, fontSize: 22}}>▼</Text></TouchableOpacity>
                        <TouchableOpacity onPress={() => { const c = {...exercicios}; c[treinoAtivo] = c[treinoAtivo].filter(e => e.id !== item.id); setExercicios(c); save(c); }}><Text style={{fontSize: 20, marginLeft: 10}}>🗑️</Text></TouchableOpacity>
                    </View>
                    <Text style={{color: Cores.sub, fontSize: 11, fontWeight: 'bold'}}>{item.feitas} / {item.series} SÉRIES</Text>
                  </View>
                  <TextInput style={[styles.exName, {color: Cores.texto, borderBottomColor: Cores.borda, borderBottomWidth: 1}]} value={item.nome} onChangeText={(v) => updateEx('nome', v)} />
                  <View style={styles.controlsRow}>
                    <Stepper label="SÉRIES" val={item.series} onMin={() => updateEx('series', Math.max(1, item.series-1))} onAdd={() => updateEx('series', item.series+1)} />
                    <Stepper label={isPrancha ? "SEGS" : "REPS"} val={item.rep} onMin={() => updateEx('rep', Math.max(1, item.rep-1))} onAdd={() => updateEx('rep', isPrancha ? item.rep + 5 : item.rep + 1)} />
                    <Stepper label="KG" val={item.carga} onMin={() => updateEx('carga', Math.max(0, item.carga-1))} onAdd={() => updateEx('carga', item.carga+1)} />
                  </View>
                  <TouchableOpacity 
                    style={[styles.btnAction, {backgroundColor: Cores.destaque}]} 
                    onPress={() => {
                        if (concluido) { updateEx('feitas', 0); return; }
                        let nl = [...exercicios[treinoAtivo]]; const i = nl.findIndex(e => e.id === item.id);
                        nl[i].feitas += 1;
                        if (isPrancha) { rodarTimer(item.rep); } 
                        else { 
                            if (nl[i].feitas >= nl[i].series) { Vibration.vibrate([0, 100, 50]); } 
                            else { rodarTimer(tempoDescanso); }
                        }
                        const c = {...exercicios}; c[treinoAtivo] = nl; setExercicios(c); save(c);
                  }}>
                    <Text style={styles.btnTxtAction}>{concluido ? 'RESETAR' : (isPrancha ? `INICIAR PRANCHA (${item.rep}s)` : `SÉRIE ${item.feitas + 1}`)}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }} ListFooterComponent={() => <TouchableOpacity style={[styles.btnFinalizar, {backgroundColor: Cores.destaque}]} onPress={finalizarTreino}><Text style={styles.btnTxtFinalizar}>FINALIZAR TREINO</Text></TouchableOpacity>}
        />
        <Modal visible={timerAtivo} transparent animationType="fade"><View style={styles.timerOverlay}><View style={[styles.timerBox, {backgroundColor: Cores.card}]}>
          <Text style={[styles.timerNum, {color: Cores.texto}]}>{segundos}s</Text>
          <View style={{flexDirection: 'row', gap: 10}}>
            <TouchableOpacity style={[styles.btnExtra, {backgroundColor: Cores.stepperBg}]} onPress={() => setSegundos(s => s + 30)}><Text style={{color: Cores.texto, fontWeight: 'bold'}}>+30s</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.btnSkip, {backgroundColor: Cores.danger}]} onPress={() => { clearInterval(timerRef.current); setTimerAtivo(false); }}><Text style={{color: '#FFF', fontWeight: 'bold'}}>PULAR</Text></TouchableOpacity>
          </View>
        </View></View></Modal>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: Cores.bg}]}>
      <View style={styles.header}><TextInput style={[styles.headerTitle, {color: Cores.texto}]} value={appTitle} onChangeText={setAppTitle} onEndEditing={() => save(null, null, null, appTitle)} /></View>
      <ScrollView contentContainerStyle={{padding: 15}}>
        <TouchableOpacity style={[styles.btnHist, {borderColor: Cores.destaque, borderWidth: 1}]} onPress={() => setTela('historico')}><Text style={{color: Cores.destaque, fontWeight: 'bold'}}>📜 VER HISTÓRICO</Text></TouchableOpacity>
        <View style={[styles.descansoCard, {backgroundColor: Cores.card}]}>
            <Text style={[styles.sectionLabel, {color: Cores.sub}]}>DESCANSO PADRÃO</Text>
            <View style={styles.descansoRow}>
                <TouchableOpacity onPress={() => { const n = Math.max(10, tempoDescanso-10); setTempoDescanso(n); save(null,null,n); }}><Text style={styles.stepAction}>-</Text></TouchableOpacity>
                <Text style={[styles.stepVal, {color: Cores.texto}]}>{tempoDescanso}s</Text>
                <TouchableOpacity onPress={() => { const n = tempoDescanso+10; setTempoDescanso(n); save(null,null,n); }}><Text style={styles.stepAction}>+</Text></TouchableOpacity>
            </View>
        </View>
        {Object.keys(exercicios).map((nome) => (
          <View key={nome} style={[styles.menuItem, {backgroundColor: Cores.card}]}>
            <View style={styles.menuOrderBtns}>
                <TouchableOpacity onPress={() => { const keys = Object.keys(exercicios); const i = keys.indexOf(nome); if (i > 0) { [keys[i], keys[i-1]] = [keys[i-1], keys[i]]; const obj = {}; keys.forEach(k => obj[k] = exercicios[k]); setExercicios(obj); save(obj); }}}><Text style={{color: Cores.sub, fontSize: 18}}>▲</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => { const keys = Object.keys(exercicios); const i = keys.indexOf(nome); if (i < keys.length - 1) { [keys[i], keys[i+1]] = [keys[i+1], keys[i]]; const obj = {}; keys.forEach(k => obj[k] = exercicios[k]); setExercicios(obj); save(obj); }}}><Text style={{color: Cores.sub, fontSize: 18}}>▼</Text></TouchableOpacity>
            </View>
            <TextInput style={[styles.menuItemTxt, {color: Cores.texto}]} defaultValue={nome} onEndEditing={(e) => { const nN = e.nativeEvent.text; if (!nN || nN === nome) return; const c = {...exercicios}; c[nN] = c[nome]; delete c[nome]; setExercicios(c); save(c); }} />
            <View style={styles.menuActionBtns}>
                <TouchableOpacity onPress={() => { setTreinoAtivo(nome); setTela('treino'); }} style={[styles.btnGo, {backgroundColor: Cores.destaque}]}><Text style={{color: '#FFF', fontSize: 12}}>▶</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => { const c = {...exercicios}; delete c[nome]; setExercicios(c); save(c); }}><Text style={{fontSize: 18}}>🗑️</Text></TouchableOpacity>
            </View>
          </View>
        ))}
        <TextInput style={[styles.inputMenu, {backgroundColor: Cores.card, color: Cores.texto, marginTop: 10}]} placeholder="Novo treino..." placeholderTextColor={Cores.sub} value={novoTreinoNome} onChangeText={setNovoTreinoNome} />
        <TouchableOpacity style={[styles.btnMenu, {backgroundColor: Cores.destaque}]} onPress={() => { if(!novoTreinoNome) return; const nE = {...exercicios, [novoTreinoNome]: []}; setExercicios(nE); setNovoTreinoNome(''); save(nE); }}><Text style={{color: '#FFF', fontWeight: 'bold'}}>+ ADICIONAR TREINO</Text></TouchableOpacity>
        <TouchableOpacity style={styles.themeBtn} onPress={() => { const nt = tema === 'light' ? 'dark' : 'light'; setTema(nt); save(null, null, null, null, nt); }}><Text style={{color: Cores.sub, fontWeight: 'bold'}}>ALTERNAR TEMA ☀️/🌙</Text></TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 30, fontWeight: '900', textAlign: 'center', flex: 1 },
  backLink: { paddingHorizontal: 20, fontSize: 24, fontWeight: 'bold' },
  addExBtn: { paddingHorizontal: 20, fontWeight: 'bold' },
  treinoRow: { marginBottom: 15 },
  card: { borderRadius: 15, padding: 18, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, alignItems: 'center' },
  exName: { fontSize: 16, fontWeight: 'bold', paddingBottom: 6, marginBottom: 15 },
  controlsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 18, width: '100%' },
  stepLabel: { fontSize: 9, fontWeight: '900', marginBottom: 4 },
  stepRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, flex: 1 },
  stepBtn: { fontSize: 20, paddingHorizontal: 12, fontWeight: 'bold' },
  stepValCard: { fontSize: 14, fontWeight: 'bold', flex: 1, textAlign: 'center' },
  btnAction: { padding: 16, borderRadius: 12, alignItems: 'center' },
  btnTxtAction: { color: '#FFF', fontWeight: 'bold' },
  btnFinalizar: { padding: 20, borderRadius: 15, alignItems: 'center', marginBottom: 40 },
  btnTxtFinalizar: { color: '#FFF', fontWeight: '900' },
  menuItem: { padding: 12, borderRadius: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  menuOrderBtns: { flexDirection: 'column', gap: 4, marginRight: 8 },
  menuItemTxt: { fontSize: 14, fontWeight: 'bold', flex: 1, marginRight: 8 },
  menuActionBtns: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  btnGo: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  btnHist: { padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 8 },
  resumoContainer: { flexDirection: 'row', gap: 10, paddingHorizontal: 15, marginBottom: 10 },
  resumoCard: { flex: 1, padding: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#3A506B20' },
  mesSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 30, paddingVertical: 15 },
  descansoCard: { padding: 8, borderRadius: 15, alignItems: 'center', marginBottom: 20 },
  descansoRow: { flexDirection: 'row', alignItems: 'center', gap: 25 },
  stepAction: { fontSize: 35, color: '#3A506B', paddingHorizontal: 10 },
  stepVal: { fontSize: 26, fontWeight: 'bold' },
  sectionLabel: { fontSize: 11, fontWeight: '900' },
  inputMenu: { padding: 15, borderRadius: 12 },
  btnMenu: { padding: 16, borderRadius: 12, alignItems: 'center' },
  themeBtn: { padding: 25, alignItems: 'center' },
  timerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' },
  timerBox: { padding: 40, borderRadius: 25, alignItems: 'center', width: width * 0.8 },
  timerNum: { fontSize: 80, fontWeight: 'bold', marginBottom: 25 },
  btnExtra: { padding: 15, borderRadius: 12, flex: 1, alignItems: 'center' },
  btnSkip: { padding: 15, borderRadius: 12, flex: 1, alignItems: 'center' }
});
