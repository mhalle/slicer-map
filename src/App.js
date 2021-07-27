import React, { useState, useEffect, useMemo } from 'react';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { DatePicker, Layout } from 'antd';
import moment from 'moment';
// import { useQueryParam, ArrayParam } from 'use-query-params';

import MapVis from './MapVis';
import useSWR from "swr";
import 'antd/dist/antd.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import './App.css'
const { RangePicker } = DatePicker;

const DateFormat = "YYYY-MM-DD";

// const DataURL 'https://download.slicer.org/download-stats/var/slicer-download-data.json';
const DataURL = 'data/slicer-download-data.json';


const { Header, Content } = Layout;
// Set your mapbox access token here
const MAPBOX_ACCESS_TOKEN =
  'pk.eyJ1IjoiaGFsYXphciIsImEiOiJja2N0dXI2Y3kxbTBoMnBxcTJnaTl3czVxIn0.MXzwZHuwNaOPKZgO17_YmA';

// Viewport settings
const INITIAL_VIEW_STATE = {
  longitude: 0,
  latitude: 10,
  zoom: 1,
  pitch: 0,
  bearing: 0
};

function App() {

  const [dateRange, setDateRange] = useState(null);
  const { data } = useSWR(DataURL, fetcher,
    { revalidateOnFocus: false });
  
    // Set control defaults using useEffect()

  // set controls using uploaded data
  useEffect(() => {
    if (data) {
    }
  }, [data]);


  const filteredAccessData = useMemo(() => {
    
    if(!data) {
      return [];
    }
    if(!dateRange || (!dateRange[0] && !dateRange[1])) {
      return data;
    }
    if(!dateRange[0]) {
      return data.filter(x => x.date.isBefore(dateRange[1]));
    }
    if(!dateRange[1]) {
      return data.filter(x => x.date.isAfter(dateRange[0]));
    }
    return data.filter(x => x.date.isBetween(dateRange[0], dateRange[1]));
  }, [data, dateRange]);


  const downloadHeatmapLayer = new HeatmapLayer({
    id: 'address-layer',
    opacity: 0.65,
    data: filteredAccessData,
    getPosition: d => d.location,
    getWeight: 1,
    aggregation: 'SUM'
  });

  const layers = [downloadHeatmapLayer];

  return (
    <Layout style={{height: '100vh'}}>
      <Header style={{ height: "64px", lineHeight: '32px',
                padding: '10px', 
                backgroundColor: "white", 
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between' }} >
        <h1 style={{display: "inline"}}>3D Slicer download map</h1>
        <RangePicker style={{}}
          allowEmpty={[true, true]}
          ranges={ {
            "All time": [null, null],
            "Last week": [moment().subtract(1, 'week'), moment()],
            "Last month": [moment().subtract(1, 'month'), moment()],
            "Last quarter": [moment().subtract(3, 'month'), moment()],
            "Last year": [moment().subtract(1, 'year'), moment()],
          }}
          onCalendarChange={setDateRange}
        
        format={DateFormat} />
      </Header>
      <Layout>
        <Layout className="site-layout">
          <Content style={{ height: "92vh", position: "relative" }}>
            <MapVis initialViewState={INITIAL_VIEW_STATE}
              layers={layers}
              mapStyle='mapbox://styles/mapbox/dark-v10'
              mapboxApiAccessToken={MAPBOX_ACCESS_TOKEN}
            />
          </Content>
        </Layout>
      </Layout >
    </Layout>


  );
}

function fetcher(url) {
  return fetch(url)
    .then(r => r.json())
    .then(j => j.access.map(x => convertRecord(x, j)));
}

function convertRecord(x, data) {
  return {
    bitstream: data.bitstream[x[0]],
    date: moment(new Date(x[1] + 'Z')),
    countryCode: x[2],
    country: data.countryCode[x[2]],
    location: data.location[x[3]].split(',').reverse().map(parseFloat)
  };
}


export default App
