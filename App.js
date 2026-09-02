import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BarChart } from 'react-native-gifted-charts';

export default function App() {
  // Exemplo de estado para o histórico de treinos
  const [historico, setHistorico] = useState([
    { id: '1', tipo: 'B', nome: 'Peito/Tríceps/Ombros', data: '25/08/2026', cargaTotal: 3636 },
    { id: '2', tipo: 'C', nome: 'Costas/Bíceps/Abdomen', data: '26/08/2026', cargaTotal: 3930 },
    { id: '3', tipo: 'A', nome: 'Pernas/Abdomen', data: '31/08/2026', cargaTotal: 5400 },
  ]);

  // Soma total da carga do mês
  const cargaTotalMes = historico.reduce((acc, item) => acc + item.cargaTotal, 0);

  // Prepara os dados para o gráfico de barras (pega os últimos 6 treinos)
  const dadosGrafico = historico.slice(-6).map((item) => {
    let cor = '#2196F3'; // Azul para Treino B
    if (item.tipo === 'A') cor = '#4CAF50'; // Verde para Treino A
    if (item.tipo === 'C') cor = '#FF9800'; // Laranja para Treino C

    return {
      value: Number((item.cargaTotal / 1000).toFixed(1)), // Transforma em Toneladas (ex: 3.6)
      label: item.tipo,
      frontColor: cor,
      topLabelComponent: () => (
        <Text style={styles.rotuloGrafico}>{(item.cargaTotal / 1000).toFixed(1)}t</Text>
      ),
    };
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Cabeçalho */}
        <View style={styles.header}>
          <Text style={styles.subtituloHeader}>HISTÓRICO</Text>
          <Text style={styles.tituloHeader}>Primeiro mês pós R-CHOP</Text>
        </View>

        {/* Card de Volume Total do Mês */}
        <View style={styles.cardCargaTotal}>
          <Text style={styles.labelCargaTotal}>CARGA TOTAL NO MÊS</Text>
          <Text style={styles.valorCargaTotal}>{cargaTotalMes.toLocaleString('pt-BR')} kg</Text>
        </View>

        {/* Seção do Gráfico */}
        {dadosGrafico.length > 0 && (
          <View style={styles.cardGrafico}>
            <Text style={styles.tituloSecao}>EVOLUÇÃO POR TREINO (TONELADAS)</Text>
            <View style={styles.containerGrafico}>
              <BarChart
                data={dadosGrafico}
                barWidth={32}
                initialSpacing={20}
                spacing={24}
                barBorderRadius={6}
                yAxisThickness={0}
                xAxisThickness={1}
                xAxisColor="#333"
                yAxisTextStyle={{ color: '#666', fontSize: 10 }}
                noOfSections={3}
                isAnimated
              />
            </View>
          </View>
        )}

        {/* Lista do Histórico */}
        <Text style={styles.tituloSecao}>ÚLTIMOS TREINOS</Text>
        {historico.map((item) => (
          <View key={item.id} style={styles.cardTreino}>
            <View style={styles.infoTreino}>
              <Text style={styles.nomeTreino}>{item.tipo} - {item.nome}</Text>
              <Text style={styles.dataTreino}>{item.data}</Text>
            </View>
            <Text style={styles.cargaTreino}>{item.cargaTotal} kg</Text>
          </View>
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 20,
    marginTop: 10,
  },
  subtituloHeader: {
    color: '#FF3B30',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  tituloHeader: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  cardCargaTotal: {
    backgroundColor: '#1C1C1E',
    padding: 20,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  labelCargaTotal: {
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
  },
  valorCargaTotal: {
    color: '#30D158',
    fontSize: 34,
    fontWeight: 'bold',
    marginTop: 6,
  },
  cardGrafico: {
    backgroundColor: '#1C1C1E',
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
  },
  containerGrafico: {
    alignItems: 'center',
    marginTop: 15,
    paddingRight: 10,
  },
  rotuloGrafico: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tituloSecao: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 10,
  },
  cardTreino: {
    backgroundColor: '#1C1C1E',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoTreino: {
    flex: 1,
  },
  nomeTreino: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  dataTreino: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 4,
  },
  cargaTreino: {
    color: '#0A84FF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
