const themes = {
  preset: {
    titleOptions: {
      titleFont: {
        size: "16px",
        style: "normal",
        weight: "bold",
        decoration: "normal",
        family: "sans-serif",
        cursor: "default"
      }
    },
    footerOptions: {
      titleFont: {
        fontSize: "12px",
        fontWeight: "bold",
        fontFamily: "sans-serif",
        cursor: "default"
      }
    },
    clusterLabelOptions: {
      x: 0,
      y: 0,
      position: 'left',
      wrapLabel: true,
      wrapOptions: {},
      fontSize: "12px",
      fontStyle: "normal",
      fontWeight: "bold",
      fontFamily: "sans-serif",
      cursor: "default"
    },
    sequenceOptions: {
      stroke: "grey",
      y: 50,
      start: null,
      stop: null,
      strokeWidth: 1,
      marker: {
        markerHeight: 10,
        stroke: "grey",
        strokeWidth: 1,
        tiltAmount: -5,
        gap: 5
      }
    },
    markerOptions: {
      x: 1,
      y: 50,
      start: null,
      stop: null,
      size: 15,
      colorScheme: null,
      customColors: null,
      marker: "arrow",
      cursor: "default",
      itemStyle: []
    },
    genesOptions: {
      x: 10,
      y: 50,
      start: null,
      stop: null,
      colorScheme: null,
      strokeWidth: 10,
      cursor: "default",
      itemStyle: []
    },
    tooltipOptions: {
      backgroundColor: "white",
      triggers: ["markers", "genes", "labels"],
      formatter: "<b>Start:</b> {start}<br><b>Stop: {stop}</b>",
      opacity: 0,
      position: "absolute",
      padding: "8px",
      borderRadius: "4px",
      border: "1px solid rgba(0,0,0,0.1)",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      pointerEvents: "none",
      fontFamily: "Arial, sans-serif",
      fontSize: "12px",
      zIndex: 1000,
      color: "#333",
      lineHeight: "1.5"
    }
  }
};

function getMarker(markerName, xPos, yPos, size, height = null) {

    height = height === null ? size : height;

    switch (markerName) {
        case "arrow":
            return `M ${xPos} ${yPos - height/2} L ${xPos + size/2} ${yPos + height/2} L ${xPos - size/2} ${yPos + height/2} Z`;
        default:
            return ""; // Default empty path
    }
}
