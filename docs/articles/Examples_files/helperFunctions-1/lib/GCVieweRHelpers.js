function DivContainer(div) {
  this.div = div;
}

function createDivContainer(targetElement) {
  var baseIdDiv = "div-container";

  var div = d3.select(targetElement)
    .attr("id", getUniqueId(baseIdDiv))
    .classed("div-content", true);

  return new DivContainer(div);
}

//Utils

function getUniqueId(baseId) {
  var i = 1;
  while (document.getElementById(baseId + "-" + i)) {
    i++;
  }
  return baseId + "-" + i;
}

function sanitizeId(str) {
  // Replace any character that is not a letter, number, underscore, or hyphen with an underscore
  return str.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function wrap(text, width, options = {}) {
  // Default options
  const defaultOptions = {
    dyAdjust: 0,
    lineHeightEms: 1.05,
    lineHeightSquishFactor: 1,
    splitOnHyphen: true,
    centreVertically: true,
  };

  // Merge default options and user-specified options
  const {
    dyAdjust,
    lineHeightEms,
    lineHeightSquishFactor,
    splitOnHyphen,
    centreVertically
  } = { ...defaultOptions, ...options };

  text.each(function () {
    var text = d3.select(this),
      x = text.attr("x"),
      y = text.attr("y");

    var words = [];
    text
      .text()
      .split(/\s+/)
      .forEach(function (w) {
        if (splitOnHyphen) {
          var subWords = w.split("-");
          for (var i = 0; i < subWords.length - 1; i++)
            words.push(subWords[i] + "-");
          words.push(subWords[subWords.length - 1] + " ");
        } else {
          words.push(w + " ");
        }
      });

    text.text(null); // Empty the text element

    var tspan = text.append("tspan");
    var line = "";
    var prevLine = "";
    var nWordsInLine = 0;

    for (var i = 0; i < words.length; i++) {
      var word = words[i];
      prevLine = line;
      line = line + word;
      ++nWordsInLine;
      tspan.text(line.trim());

      if (tspan.node().getComputedTextLength() > width && nWordsInLine > 1) {
        tspan.text(prevLine.trim());
        prevLine = "";
        line = word;
        nWordsInLine = 1;
        tspan = text.append("tspan").text(word.trim());
      }
    }

    var tspans = text.selectAll("tspan");
    var h = lineHeightEms;

    if (tspans.size() > 2)
      for (var i = 0; i < tspans.size(); i++) h *= lineHeightSquishFactor;

    tspans.each(function (d, i) {
      var dy = i * h + dyAdjust;
      if (centreVertically) dy -= ((tspans.size() - 1) * h) / 2;
      d3.select(this)
        .attr("y", y)
        .attr("x", x)
        .attr("dy", dy + "em");
    });
  });
}

function adjustViewBox(svg, options = {}) {
  const defaultOptions = {
    padding: {
      left: 10,
      right: 10,
      top: 10,
      bottom: 10
    }
  };

  const { padding } = { ...defaultOptions, ...options };

  // Get Container Dimensions
  var width = svg.node().getBoundingClientRect().width;
  var height = svg.node().getBoundingClientRect().height;

  // Adjust viewBox
  var bbox = svg.node().getBBox();
  svg.attr("viewBox", [
    bbox.x - padding.left,
    bbox.y - padding.top,
    bbox.width + padding.left + padding.right,
    bbox.height + padding.top + padding.bottom,
  ]);

  return svg;
};

function computeSize(inputSize, containerSize) {

    // If inputSize is undefined or null, return 0
    if (typeof inputSize === "undefined" || inputSize === null) {
        return 0;
    }

    // If inputSize is a number, return it directly
    if (typeof inputSize === "number") {
        return inputSize;
    }

    // Initialize resultSize
    var resultSize;

    // Check if the size is given as a percentage
    if (inputSize.includes("%")) {
        var percentageValue = parseFloat(inputSize);
        var fraction = percentageValue / 100;
        resultSize = Math.round(fraction * containerSize);
    }
    // Check if the size is given in pixels
    else if (inputSize.includes("px")) {
        resultSize = parseFloat(inputSize);
    }
    // Assume it's a plain number otherwise
    else {
        resultSize = parseFloat(inputSize);
    }

    return resultSize;
}

function adjustGeneLabels(clusterContainer, labelSelector, options = {}) {
    // Default options
    const defaultOptions = {
        rotation: 65, // Rotation angle (in degrees)
        dx: "-0.8em", // Horizontal adjustment
        dy: "0.15em", // Vertical adjustment
    };

    // Merge default options with the provided options
    const { rotation, dx, dy } = { ...defaultOptions, ...options };

    // Select all the labels based on the provided selector
    var labels = clusterContainer.svg.selectAll(".label").nodes();

    // Iterate over each label
    for (var i = 0; i < labels.length - 1; i++) {
        var label1 = labels[i].getBoundingClientRect();

        // Compare it with all the labels that come after it
        for (var j = i + 1; j < labels.length; j++) {
            var label2 = labels[j].getBoundingClientRect();

            // If the labels overlap
            if (!(label1.right < label2.left ||
                  label1.left > label2.right ||
                  label1.bottom < label2.top ||
                  label1.top > label2.bottom)) {

                // Get the current x and y attributes of the labels
                var x1 = parseFloat(d3.select(labels[i]).attr('x'));
                var y1 = parseFloat(d3.select(labels[i]).attr('y'));
                var x2 = parseFloat(d3.select(labels[j]).attr('x'));
                var y2 = parseFloat(d3.select(labels[j]).attr('y'));

                // Rotate both labels
                d3.select(labels[i])
                    .style("text-anchor", "end")
                    .attr("dx", dx)
                    .attr("dy", dy)
                    .attr("transform", `rotate(${rotation}, ${x1}, ${y1})`);

                d3.select(labels[j])
                    .style("text-anchor", "end")
                    .attr("dx", dx)
                    .attr("dy", dy)
                    .attr("transform", `rotate(${rotation}, ${x2}, ${y2})`);
            }
        }
    }
    return clusterContainer;
}

function adjustSpecificLabel(clusterContainer, labelSelector, elementId, options = {}) {
    // Default options
    const defaultOptions = {
        rotation: 65, // Rotation angle (in degrees)
        shiftAmount: 15, // Amount to shift to the right
        dx: "-0.8em", // Horizontal adjustment
        dy: "0.15em", // Vertical adjustment
    };

    const overlapPercentage = (rect1, rect2) => {
        const x_overlap = Math.max(0, Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left));
        const y_overlap = Math.max(0, Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top));
        const overlapArea = x_overlap * y_overlap;
        const rect1Area = (rect1.right - rect1.left) * (rect1.bottom - rect1.top);
        return (overlapArea / rect1Area) * 100;
    };

    // Merge default options with the provided options
    const { rotation, dx, dy, shiftAmount } = { ...defaultOptions, ...options };

    // Select all the labels based on the provided selector
    var labels = clusterContainer.svg.selectAll(labelSelector).nodes();

    // Select the specific label using the provided elementId
    var specificLabel = clusterContainer.svg.select(`#${elementId}`).node();
    var specificLabelRect = specificLabel.getBoundingClientRect();

    // Check for overlap with other labels
    for (var i = 0; i < labels.length; i++) {
        if (labels[i] !== specificLabel) { // Ensure we're not comparing the label with itself
            var labelRect = labels[i].getBoundingClientRect();

            // If the specific label overlaps with another label
            if (overlapPercentage(specificLabelRect, labelRect) > 0) {
                const currentShiftAmount = (overlapPercentage(specificLabelRect, labelRect) > 80) ? shiftAmount : 0;

                // Get the current x and y attributes of the specific label
                var x = parseFloat(d3.select(specificLabel).attr('x'));
                var y = parseFloat(d3.select(specificLabel).attr('y')) - 5;

                // First shift the label
                x += currentShiftAmount;

                // Then, rotate the specific label
                d3.select(specificLabel)
                    .style("text-anchor", "end")
                    .attr("dx", dx)
                    .attr("dy", dy)
                    .attr("x", x)
                    .attr("transform", `rotate(${rotation}, ${x}, ${y})`);

                // Break out of the loop once we've adjusted the specific label
                break;
            }
        }
    }
    return clusterContainer;
}

function camelToKebab(string) {
    return string.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
}

function extractAdditionalOptions(combinedOptions, defaultOptions) {
  // Extract additional options that are not in defaultOptions
  const additionalOptions = Object.keys(combinedOptions).reduce((acc, key) => {
    if (!(key in defaultOptions)) {
      acc[key] = combinedOptions[key];
    }
    return acc;
  }, {});

  return additionalOptions;
}

function setAttributesFromOptions(currentElement, additionalOptions) {
  for (const [key, value] of Object.entries(additionalOptions)) {
    currentElement.attr(camelToKebab(key), value);
  }
}

function applyStyleToElement(currentElement, itemStyle, i) {
  const style = itemStyle.find(s => s.index === i);
  if (style) {
    for (const [key, value] of Object.entries(style)) {
      if (key !== 'index' && key !== 'labelAdjustmentOptions') {
        currentElement.style(camelToKebab(key), value);
      }
    }
  }
}

function removeNullKeys(obj) {
    const cleanObj = { ...obj };
    for (let key in cleanObj) {
      if (cleanObj[key] === null) {
        delete cleanObj[key];
      }
    }
    return cleanObj;
}

function mergeOptions(defaultOptions, themeOptionsKey, userOptions) {
  // Start with default options
  let combinedOptions = { ...defaultOptions };
  let themeOpts = removeNullKeys(this.themeOptions?.[themeOptionsKey] ?? {});

  userOptions = removeNullKeys(userOptions);

  // Iterate over the keys in defaultOptions
  for (let key in defaultOptions) {
    if (typeof defaultOptions[key] === 'object' && !Array.isArray(defaultOptions[key]) && defaultOptions[key] !== null) {
      combinedOptions[key] = {
        ...defaultOptions[key],
        ...(themeOpts[key] || {}), // Safeguard against undefined values
        ...(userOptions[key] || {}) // Safeguard against undefined values
      };
    } else {
      // Direct merge for non-object or null properties
      combinedOptions[key] = userOptions[key] !== undefined ? userOptions[key] : (themeOpts[key] !== undefined ? themeOpts[key] : defaultOptions[key]);
    }
  }

  return combinedOptions;
}

function getColorScale(colorScheme, customColors, uniqueGroups) {
  let colorScale;

  // Check if customColors is an object and not an array
  if (customColors && typeof customColors === 'object' && !Array.isArray(customColors)) {
        // Find groups without a corresponding color in customColors
    const unmappedGroups = uniqueGroups.filter(group => !(group in customColors));
    // Issue a warning if there are unmapped groups
    if (unmappedGroups.length > 0) {
      console.warn(`Warning: No color mapping found for the following groups, defaulting to black: ${unmappedGroups.join(', ')}`);
    }


    // Create a color scale based on the customColors object
    colorScale = d3.scaleOrdinal()
      .domain(uniqueGroups)
      .range(uniqueGroups.map(group => customColors[group] || "black"));
  } else if (colorScheme) {
    if (!d3[colorScheme]) {
      console.warn(`Warning: The color scheme "${colorScheme}" does not exist. Defaulting to black.`);
      colorScale = d3.scaleOrdinal()
        .domain(uniqueGroups)
        .range(uniqueGroups.map(() => "black")); // Set all colors to black
    } else {
      colorScale = d3.scaleOrdinal(d3[colorScheme])
        .domain(uniqueGroups);
      // Check if uniqueGroups are more than the colors in the colorScale
      if (uniqueGroups.length > colorScale.range().length) {
        console.warn(`Warning: More unique groups than colors. Some colors will repeat.`);
      }
    }
  } else if (customColors && customColors.length > 0) {
    colorScale = d3.scaleOrdinal()
      .domain(uniqueGroups)
      .range(customColors);
  } else {
    colorScale = d3.scaleOrdinal(d3.schemeCategory10)
      .domain(uniqueGroups);
  }

  return colorScale;
}

function isInAnyDiscontinuity(value, breaks) {
    for (let gap of breaks) {
        if (value >= gap.start && value <= gap.stop) {
            return true;
        }
    }
    return false;
}

function createDiscontinuousScale(minStart, maxStop, width, margin, breaks, reverse = false) {
    let totalGap = 0;

    // Calculate the total gap based on all discontinuities
    for (let gap of breaks) {
        if (gap.start >= minStart && gap.stop <= maxStop) {
            totalGap += (gap.stop - gap.start);
        }
    }

    // Define the linear scale. Adjust the scale based on the reverse option.
    let domainStart = reverse ? maxStop - totalGap : minStart;
    let domainEnd = reverse ? minStart : maxStop - totalGap;

    const linearScale = d3.scaleLinear()
        .domain([domainStart, domainEnd])
        .range([0, width - margin.left - margin.right]);

    // Proxy object for discontinuous scale
    const scaleProxy = function(value) {
        if (isInAnyDiscontinuity(value, breaks)) {
            return null;
        }

        let cumulativeAdjustment = 0;

        // Adjust the value by all previous discontinuities
        for (let gap of breaks) {
            if (value > gap.stop) {
                cumulativeAdjustment += (gap.stop - gap.start);
            } else {
                break;
            }
        }

        // Apply reverse logic to the value adjustment
        value = value - cumulativeAdjustment;

        return linearScale(value);
    };

    // Dynamically copy all methods and properties from linearScale to scaleProxy
    for (let prop in linearScale) {
        if (typeof linearScale[prop] === 'function') {
            scaleProxy[prop] = (...args) => {
                const result = linearScale[prop](...args);
                return result === linearScale ? scaleProxy : result;
            };
        } else {
            scaleProxy[prop] = linearScale[prop];
        }
    }

    return scaleProxy;  // Return the discontinuous scale
}

function parseAndStyleText(text, parentElement, fontOptions) {
  const tagRegex = /<([biu])>(.*?)<\/\1>/g;

  let lastIndex = 0;

  // Helper function to append text with specific styles
  const appendText = (content, isBold = false, isItalic = false, isUnderline = false) => {
    const tspan = parentElement.append("tspan")
      .style("font-weight", isBold ? "bold" : fontOptions.weight)
      .style("font-style", isItalic ? "italic" : fontOptions.style)
      .text(content);

    if (isUnderline) {
      tspan.style("text-decoration", "underline");
    }
  };

  // Iterate through the string and apply styles
  text.replace(tagRegex, function(match, tag, content, offset) {
    // Append text before the tag
    if (offset > lastIndex) {
      appendText(text.substring(lastIndex, offset), false, false, false);
    }

    // Apply style based on the tag
    appendText(content, tag === 'b', tag === 'i', tag === 'u');

    lastIndex = offset + match.length;
    return match; // This return is not used, but is necessary for the replace function
  });

  // Append any remaining text after the last tag
  if (lastIndex < text.length) {
    appendText(text.substring(lastIndex), false, false, false);
  }
}

// CLuster

function clusterContainer(svg, margin, width, height) {
  this.svg = svg;
  this.margin = margin;
  this.width = width;
  this.height = height;
}

function createClusterContainer(targetElementId, options = {}) {

  const defaultOptions = {
    id: "svg-container",
    margin: { top: 0, right: "10%", bottom: 0, left: "10%" },
    style: {
      backgroundColor: "#0000"
    },
    width: null,
    height: null
  };

  // Merge default options and user-specified options
  const combinedOptions = mergeOptions.call(this, defaultOptions, 'clusterOptions', options);
  const { id, margin: originalMargin, style, width, height } = combinedOptions;

  // Extract additional options that are not in defaultOptions
  const additionalOptionsStyle = extractAdditionalOptions(style, defaultOptions.style);

  // Compute margins without modifying the original margin object
  const computedMargin = {
    top: computeSize(originalMargin.top, height),
    right: computeSize(originalMargin.right, width),
    bottom: computeSize(originalMargin.bottom, height),
    left: computeSize(originalMargin.left, width)
  };

  var svg = d3.select(targetElementId)
    .append("svg")
    .attr("id", getUniqueId(id))
    .attr("width", width || "100%")
    .attr("height", height || "100%")
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", `0 0 ${width || computedWidth} ${height || computedHeight}`)
    .classed("GCVieweR-svg-content", true)
    .style("box-sizing", "border-box")
    .style("background-color", style.backgroundColor)
    .each(function() {
      const currentElement = d3.select(this);
      setAttributesFromOptions(currentElement, additionalOptionsStyle);
    });

  // Apply styles from the combined options
  Object.entries(style).forEach(([key, value]) => {
    svg.style(key, value);
  });

  return new clusterContainer(svg, computedMargin, width, height);
}

clusterContainer.prototype.theme = function (themeName) {
  // Make sure the theme exists
  if (!themes.hasOwnProperty(themeName)) {
    throw new Error(`Theme '${themeName}' does not exist.`);
  }

  // Retrieve the theme
  const themeOptions = themes[themeName];

  // Save the theme options to the instance for later use
  this.themeOptions = themeOptions;

  return this;
};

clusterContainer.prototype.geneData = function (data, clusterData) {

  // Needed to set color
  this.dataAll = data

  this.data = clusterData.map(item => {
    var newItem = {...item};

    // Convert cluster to string
    newItem.cluster = String(newItem.cluster);

    newItem.direction = "forward";
    if(newItem.start > newItem.stop) {
      newItem.direction = "reverse";
    }

    return newItem;
  });

  return this;
};

clusterContainer.prototype.scale = function(options = {}) {
  // Verify that the data exists
  if (!this.data) {
    console.error('No data has been added to this cluster container.');
    return this;
  }

  // Default options specific for scales and axis
  const defaultScaleOptions = {
    start: null,
    stop: null,
    hidden: true,
    reverse: false,
    axisType: "bottom",
    breaks: [],
    tickValues: null,
    ticksCount: 20,
    ticksFormat: ",.0f",
    y: null,
    tickStyle: {
      stroke: "grey",
      strokeWidth: 1,
      lineLength: 6
    },
    textStyle: {
      fill: "black",
      fontSize: "10px",
      fontFamily: "Arial",
      cursor: "default"
    },
    lineStyle: {
      stroke: "grey",
      strokeWidth: 1
    }
  };

  // Merge provided options with the default ones
  const combinedOptions = mergeOptions.call(this, defaultScaleOptions, 'scaleOptions', options);

  // De-structure the combined options
  const { start, stop, hidden, breaks, tickValues, reverse, axisType, ticksCount, ticksFormat, y: initialY, tickStyle, textStyle, lineStyle } = combinedOptions;

  // Determine y based on axisType and initialY
  const y = initialY !== null ? initialY : (axisType === 'bottom' ? 30 : 80);

  // Extract additional options that are not in defaultScaleOptions
  const additionalOptionsTickStyle = extractAdditionalOptions(tickStyle, defaultScaleOptions.tickStyle);
  const additionalOptionsTextStyle = extractAdditionalOptions(textStyle, defaultScaleOptions.textStyle);
  const additionalOptionslineStyle = extractAdditionalOptions(lineStyle, defaultScaleOptions.lineStyle);

  // Filter data based on the provided start and stop values
  if (start !== null) {
    this.data = this.data.filter(d => d.start >= start);
  }
  if (stop !== null) {
    this.data = this.data.filter(d => d.stop <= stop);
  }

  // Filter out data where start or stop falls within any of the breaks
  this.data = this.data.filter(d => {
    return !breaks.some(gap =>
      (d.start >= gap.start && d.start <= gap.stop) ||
      (d.stop >= gap.start && d.stop <= gap.stop)
    );
  });

  this.reverse = reverse;

  // Use provided start and stop values if they exist, otherwise compute them from data
  this.minStart = start !== null ? start : d3.min(this.data, d => Math.min(d.start, d.stop));
  this.maxStop = stop !== null ? stop : d3.max(this.data, d => Math.max(d.start, d.stop));

  // Create scales
  this.xScale = createDiscontinuousScale(this.minStart, this.maxStop, this.width, this.margin, breaks, reverse);
  this.yScale = d3.scaleLinear()
    .domain([0, 100])
    .range([this.height - this.margin.bottom - this.margin.top, 0]);

  // Filter breaks within the scale range
  this.breaks = breaks.filter(gap => gap.start >= this.minStart && gap.stop <= this.maxStop);

  const that = this;
  if (!hidden) {

  // Create and configure the X-axis
  const adjustedYOffset = this.yScale ? this.yScale(y) : y;
  const axisGroup = this.svg.append("g")
    .attr("transform", `translate(${this.margin.left},${this.margin.top + adjustedYOffset})`);

  linearScale = d3.scaleLinear()
        .domain([this.minStart, this.maxStop])
        .range([0, this.width - this.margin.left - this.margin.right]);

  const xAxis = d3.axisBottom(linearScale)
    .tickFormat(d3.format(ticksFormat));

    if (Array.isArray(tickValues) && tickValues.length > 0) {
      xAxis.tickValues(tickValues);
    } else if (typeof tickValues === 'number') {
      xAxis.tickValues([tickValues]);
    } else {
      xAxis.ticks(ticksCount);
    }

  const axis = axisGroup.append("g").call(xAxis);

  // Style axis lines and text
  axis.selectAll(".tick line")
    .style("stroke", tickStyle.stroke)
    .style("stroke-width", tickStyle.strokeWidth)
    .attr("y2", tickStyle.lineLength)
    .each(function() {
      const currentElement = d3.select(this)
      setAttributesFromOptions(currentElement, additionalOptionsTickStyle);
    });

  axis.selectAll(".tick text")
    .style("fill", textStyle.fill)
    .style("font-size", textStyle.fontSize)
    .style("font-family", textStyle.fontFamily)
    .each(function() {
      const currentElement = d3.select(this)
      setAttributesFromOptions(currentElement, additionalOptionsTextStyle);
    });

    axis.selectAll(".tick").each(function(d) {
      let tickValue = d3.select(this).data()[0];
      let newX = that.xScale(tickValue);

     if (newX === null) {
      // If the new X position is null, remove the tick
      d3.select(this).remove();
      } else {
      // Otherwise, update the transform attribute
      d3.select(this).attr("transform", `translate(${newX},0)`);
      }
    });

  axis.select(".domain")
    .style("stroke", lineStyle.stroke)
    .style("stroke-width", lineStyle.strokeWidth)
    .each(function() {
      const currentElement = d3.select(this);
      setAttributesFromOptions(currentElement, additionalOptionslineStyle);
    });

  }
  return this;
};

clusterContainer.prototype.title = function(title, subtitle, show = true, options = {}) {

  // Return early if neither title nor subtitle is provided
  if (!title && !subtitle) {
    return this;
  }

  if (!show) {
    return this;
  }

  // Default options for title and subtitle
  const defaultOptions = {
    x: 0,
    y: 20,
    position: "center",
    spacing: 20, // Default spacing between title and subtitle
    titleFont: {
      size: "16px",
      style: "normal",
      weight: "bold",
      decoration: "normal",
      family: "sans-serif",
      cursor: "default"
    },
    subtitleFont: {
      size: "14px",
      style: "normal",
      weight: "normal",
      decoration: "none",
      family: "sans-serif",
      cursor: "default"
    },
  };

  const combinedOptions = mergeOptions.call(this, defaultOptions, 'titleOptions', options);
  const { x, y, titleFont, subtitleFont, position, spacing } = combinedOptions;

  // Extract additional options that are not in defaultOptions
  const additionalOptionsTitleFont = extractAdditionalOptions(titleFont, defaultOptions.titleFont);
  const additionalOptionsSubtitleFont = extractAdditionalOptions(subtitleFont, defaultOptions.subtitleFont);

  let xPos;
  let textAnchor;

  // Determine text position and anchor based on the provided position
  switch (position) {
    case "left":
      xPos = x;
      textAnchor = "start";
      break;
    case "right":
      xPos = this.width - x;
      textAnchor = "end";
      break;
    default:
      xPos = x + (this.width / 2);
      textAnchor = "middle";
  }

  if(title){
  // Add title to the SVG
  this.svg.append("text")
    .attr("x", xPos)
    .attr("y", y + (this.margin.top / 2))
    .attr("text-anchor", textAnchor)
    .style("font-size", titleFont.size)
    .style("font-style", titleFont.style)
    .style("font-weight", titleFont.weight)
    .style("text-decoration", titleFont.decoration)
    .style("font-family", titleFont.family)
    .style("cursor", titleFont.cursor)
    .each(function() {
      const currentElement = d3.select(this);
      parseAndStyleText(title, currentElement, titleFont);
      setAttributesFromOptions(currentElement, additionalOptionsTitleFont);
    });
  }

  // Add subtitle to the SVG if provided
  if (subtitle) {
    this.svg.append("text")
      .attr("x", xPos)
      .attr("y", y + (this.margin.top / 2) + spacing)
      .attr("text-anchor", textAnchor)
      .style("font-size", subtitleFont.size)
      .style("font-style", subtitleFont.style)
      .style("font-weight", subtitleFont.weight)
      .style("text-decoration", subtitleFont.decoration)
      .style("font-family", subtitleFont.family)
      .style("cursor", subtitleFont.cursor)
      .each(function() {
        const currentElement = d3.select(this);
        parseAndStyleText(subtitle, currentElement, subtitleFont);
        setAttributesFromOptions(currentElement, additionalOptionsSubtitleFont);
      });
  }

  return this;
};

clusterContainer.prototype.footer = function(title, subtitle, show = true, options = {}) {

  // Return early if neither title nor subtitle is provided
  if (!title && !subtitle) {
    return this;
  }

  if (!show) {
    return this;
  }

  // Default options for title and subtitle
  const defaultOptions = {
    x: 0,
    y: 0,
    position: "left",
    spacing: 12, // Default spacing between title and subtitle
    titleFont: {
      fontSize: "12px",
      fontWeight: "bold",
      fontStyle: "normal",
      fontFamily: "sans-serif",
      cursor: "default"
    },
    subtitleFont: {
      fontSize: "10px",
      fontWeight: "normal",
      fontStyle: "normal",
      fontFamily: "sans-serif",
      cursor: "default"
    },
  };

  const combinedOptions = mergeOptions.call(this, defaultOptions, 'footerOptions', options);
  const { x, y, titleFont, subtitleFont, position, spacing } = combinedOptions;

  // Extract additional options that are not in defaultOptions
  const additionalOptionsTitleFont = extractAdditionalOptions(titleFont, defaultOptions.titleFont);
  const additionalOptionsSubtitleFont = extractAdditionalOptions(subtitleFont, defaultOptions.subtitleFont);

  let xPos;
  let textAnchor;

  // Determine text position and anchor based on the provided position
  switch (position) {
    case "left":
      xPos = x + 6;
      textAnchor = "start";
      break;
    case "right":
      xPos = this.width - x - 6;
      textAnchor = "end";
      break;
    default:
      xPos = (this.width / 2) + x;
      textAnchor = "middle";
}


  // Calculate y position for title and subtitle based on the SVG height and bottom margin
  const titleYPos = this.height - this.margin.bottom + y - 20;
  const subtitleYPos = titleYPos + spacing;

  if (title) {
  this.svg.append("text")
    .attr("x", xPos)
    .attr("y", titleYPos)
    .attr("text-anchor", textAnchor)
    .style("font-size", titleFont.fontSize)
    .style("font-weight", titleFont.fontWeight)
    .style("font-style", titleFont.fontStyle)
    .style("font-family", titleFont.fontFamily)
    .style("cursor", titleFont.cursor)
    .each(function() {
      const currentElement = d3.select(this);
      parseAndStyleText(title, currentElement, titleFont);
      setAttributesFromOptions(currentElement, additionalOptionsTitleFont);
    });

  }

  // Add subtitle to the SVG if provided
  if (subtitle) {
    this.svg.append("text")
      .attr("x", xPos)
      .attr("y", subtitleYPos)
      .attr("text-anchor", textAnchor)
      .style("font-size", subtitleFont.fontSize)
      .style("font-weight", subtitleFont.fontWeight)
      .style("font-style", subtitleFont.fontStyle)
      .style("font-family", subtitleFont.fontFamily)
      .style("cursor", subtitleFont.cursor)
      .each(function() {
        const currentElement = d3.select(this);
        parseAndStyleText(subtitle, currentElement, subtitleFont);
        setAttributesFromOptions(currentElement, subtitleFont);
      });
  }

  return this;
};

clusterContainer.prototype.clusterLabel = function(title, show = true, options = {}) {
  if (!show) {
    return this;
  }

  // Default options
  const defaultOptions = {
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
  };

  // Merge the options using the generic function
  const combinedOptions = mergeOptions.call(this, defaultOptions, 'clusterLabelOptions', options);
  const {
    x,
    y,
    position,
    wrapLabel,
    wrapOptions,
    fontSize,
    fontStyle,
    fontWeight,
    fontFamily,
    cursor,
  } = combinedOptions;

  const additionalwrapOptions = extractAdditionalOptions(wrapOptions, defaultOptions.wrapOptions);
  // Extract additional options that are not in defaultOptions
  const additionalOptions = extractAdditionalOptions(combinedOptions, defaultOptions);

  const titleFont = {
    size: fontSize,
    style: fontStyle,
    weight: fontWeight,
    family: fontFamily,
    cursor: cursor
  };

  // calculate middle y position
  const adjustedHeight = this.height - this.margin.top - this.margin.bottom;
  const middleY = this.margin.top + adjustedHeight / 2 + y;
  const titleWidth = position === 'left' ? this.margin.left - x : this.margin.right - x;

  let xPosition;
  if (position === 'left') {
    xPosition = this.margin.left / 2 + x;  // title is in the left margin
  } else {  // 'right'
    xPosition = this.width - this.margin.right / 2 - x;  // title is in the right margin
  }

  let clusterTitle = this.svg.append("text")
    .attr("x", xPosition)
    .attr("y", middleY)
    .attr("text-anchor", "middle")  // text is always centered
    .attr("dominant-baseline", "central")  // Vertically center text
    .style("font-size", fontSize)
    .style("font-style", fontStyle)
    .style("font-weight", fontWeight)
    .style("font-family", fontFamily)
    .style("cursor", cursor)
    .each(function() {
      const currentElement = d3.select(this);

      if (!wrapLabel) {
        // Set the text and apply styles only if wrapLabel is false
        parseAndStyleText(title, currentElement, titleFont);
      } else {
        currentElement.text(title);
        // If wrapLabel is true, wrap the text
        wrap(currentElement, titleWidth, wrapOptions);
        currentElement.selectAll("tspan").each(function() {
          const currentTspan = d3.select(this);
          const tspanText = currentTspan.text();
          currentTspan.text('');
          parseAndStyleText(tspanText, currentTspan, titleFont);
        });
      }
      setAttributesFromOptions(currentElement, additionalOptions);
    });

  return this;
};

clusterContainer.prototype.sequence = function(show = true, options = {}) {
  if (!show) {
    return this;
  }

  if (!this.data) {
    console.error('No data has been added to this cluster container. Please use the addGeneData() function before attempting to draw a gene line.');
    return this;
  }

  const defaultOptions = {
    y: 50,
    start: null,
    stop: null,
    sequenceStyle: { // Adding sequenceStyle
      stroke: "grey",
      strokeWidth: 1
    },
    markerStyle: {
      markerHeight: 10,
      stroke: "grey",
      strokeWidth: 1,
      tiltAmount: -5,
      gap: 0
    }
  };

  // Merge the default options with any predefined sequenceOptions and the provided options
  const combinedOptions = mergeOptions.call(this, defaultOptions, 'sequenceOptions', options);
  const { y, start, stop, markerStyle, sequenceStyle } = combinedOptions;

  // Extract additional options that are not in defaultOptions for sequenceStyle
  const additionalOptionsSequence = extractAdditionalOptions(sequenceStyle, defaultOptions.sequenceStyle);

  var g = this.svg.append("g")
    .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

  // Draw baseline with sequenceStyle
  g.append("line")
    .attr("class", "baseline")
    .attr("x1", this.xScale(start || this.minStart))
    .attr("y1", this.yScale(y))
    .attr("x2", this.xScale(stop || this.maxStop))
    .attr("y2", this.yScale(y))
    .style("stroke", sequenceStyle.stroke)
    .style("stroke-width", sequenceStyle.strokeWidth)
    .each(function() {
      const currentElement = d3.select(this);
      setAttributesFromOptions(currentElement, additionalOptionsSequence);
    });

  // Draw break markers with tilted lines
  for (let gap of this.breaks) {
    const xStart = this.xScale(gap.start - 0.001) * (1 - markerStyle.gap / 100);
    const xEnd = this.xScale(gap.stop + 0.001) * (1 + markerStyle.gap / 100);
    const yBase = this.yScale(y);
    const yTop = yBase - markerStyle.markerHeight / 2;
    const yBottom = yBase + markerStyle.markerHeight / 2;

    if (xStart !== null && xEnd !== null) {
      g.append("line")
        .attr("class", "gap-line")
        .attr("x1", xStart + (markerStyle.tiltAmount / 2))
        .attr("y1", yBase)
        .attr("x2", xEnd - (markerStyle.tiltAmount / 2))
        .attr("y2", yBase)
        .attr("stroke", "#0000")
        .style("stroke-width", sequenceStyle.strokeWidth * 1.1);
    }

    if (xStart !== null) {
      // Draw the tilted line before the gap
      g.append("line")
        .attr("x1", xStart)
        .attr("y1", yTop)
        .attr("x2", xStart + markerStyle.tiltAmount)
        .attr("y2", yBottom)
        .attr("stroke", markerStyle.stroke)
        .attr("stroke-width", markerStyle.strokeWidth);
    }

    if (xEnd !== null) {
      // Draw the tilted line after the gap
      g.append("line")
        .attr("x1", xEnd - markerStyle.tiltAmount)
        .attr("y1", yTop)
        .attr("x2", xEnd)
        .attr("y2", yBottom)
        .attr("stroke", markerStyle.stroke)
        .attr("stroke-width", markerStyle.strokeWidth);
    }
  }

  return this;
};

/*
clusterContainer.prototype.markers = function(group, show = true, options = {}) {

  if (!show) {
    return this;
  }

  // Verify that the data exists
  if (!this.data) {
    console.error('No data has been added to this cluster container. Please use the geneData() function before attempting to draw markers.');
    return this;
  }

  const defaultOptions = {
    x: 1,
    y: 50,
    start: null,
    stop: null,
    size: 15,
    colorScheme: null,
    customColors: null,
    marker: "arrow",
    cursor: "default",
    itemStyle: [] // {index: 1, strokeWidth : 10, stroke : "black"}
  };

  const combinedOptions = mergeOptions.call(this, defaultOptions, 'markerOptions', options);

  const { x, y, start, stop, size, colorScheme, customColors, marker, cursor, itemStyle } = combinedOptions;

  // Extract additional options that are not in defaultOptions
  const additionalOptions = extractAdditionalOptions(combinedOptions, defaultOptions);

  // Color Scale Setup
  const uniqueGroups = [...new Set(this.data.map(d => d[group]))];
  // Adjust colorScale to use uniqueGroups
  const colorScale = getColorScale(colorScheme, customColors, uniqueGroups);

  // Create the group
  var g = this.svg.append("g")
    .attr("transform", "translate(" + (this.margin.left) + "," + this.margin.top + ")");  // Apply x offset here

  const getAttributesForIndex = (d, i) => {
    const style = itemStyle.find(s => s.index === i) || {};
    const currentX = style.x || x;
    const currentY = style.y || y;
    const currentSize = style.size || size;
    const currentMarker = style.marker || marker;

    const offset = currentSize / 2;
    const yPos = this.yScale(currentY);
    const xPos = d.direction === 'forward' ? this.xScale(d.stop) - offset + currentX : this.xScale(d.stop) + offset - currentX;

    return { xPos, yPos, currentSize, currentMarker };
   };

  // Create triangles
  g.selectAll(".marker")
   .data(this.data)
   .enter()
   .append("path")
   .attr("d", (d, i) => {
      const { xPos, yPos, currentSize, currentMarker } = getAttributesForIndex(d, i);

      const absoluteDifference = Math.abs(this.xScale(d.stop) - this.xScale(d.start));
      const markerHeight = currentSize < absoluteDifference ? currentSize : absoluteDifference;

      return getMarker(currentMarker, xPos, yPos, currentSize, markerHeight);
    })
    .attr("transform", (d, i) => {
      const { xPos, yPos } = getAttributesForIndex(d, i);
      const rotation = d.direction === 'forward' ? 90 : -90;
      return `rotate(${rotation}, ${xPos}, ${yPos})`;
    })
   .attr("fill", (d) => colorScale(d[group]))
   .attr("class", "marker")
   .attr("id", (d, i) => `${sanitizeId(d.cluster)}-marker-${i}`)
   .attr("rowID", (d, i) => `${d["rowID"]}`)
   .style("cursor", cursor)
   .each(function (d, i) {
      const currentElement = d3.select(this);

      // Set additional options as attributes
      setAttributesFromOptions(currentElement, additionalOptions);

      // Override with itemStyle based on the index
      applyStyleToElement(currentElement, itemStyle, i);
  })
  //Make markers available to tooltip
  this.markers = g.selectAll(".marker");

  return this;
};

clusterContainer.prototype.genes = function(group, show = true, options = {}) {
  if (!show) {
    return this;
  }

  // Verify that the data exists
  if (!this.data) {
    console.error('No data has been added to this cluster container. Please use the geneData() function before attempting to draw genes.');
    return this;
  }

  const defaultOptions = {
    x: 10,
    y: 50,
    start: null,
    stop: null,
    colorScheme: null,
    customColors: null,
    height: 10,
    strokeWidth: 1,
    stroke: 'black',
    cursor: "default",
    itemStyle: []
  };

  const combinedOptions = mergeOptions.call(this, defaultOptions, 'genesOptions', options);
  const { x, y, start, stop, colorScheme, customColors, itemStyle, height, strokeWidth, stroke, cursor } = combinedOptions;

  // Extract additional options that are not in defaultOptions
  const additionalOptions = extractAdditionalOptions(combinedOptions, defaultOptions);

  // Color Scale Setup
  const uniqueGroups = [...new Set(this.data.map(d => d[group]))];
  const colorScale = getColorScale(colorScheme, customColors, uniqueGroups);

  // Create the group
  const g = this.svg.append("g")
    .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

  const getAttributesForIndex = (d, i) => {
    const style = itemStyle.find(s => s.index === i) || {};
    const currentX = style.x || x;
    const currentY = style.y || y;

    const xPosStart = d.direction === 'forward' ? this.xScale(d.start) : this.xScale(d.stop) + currentX;
    const xPosEnd = d.direction === 'forward' ? (Math.max(this.xScale(d.start), this.xScale(d.stop)) - currentX) : Math.max(this.xScale(d.stop), this.xScale(d.start));
    const rectWidth = xPosEnd - xPosStart;
    const yPos = this.yScale(currentY) - height / 2;

    return { xPosStart, yPos, rectWidth };
  };

  // Draw Genes as Rectangles
  g.selectAll(".gene")
    .data(this.data)
    .enter()
    .append("rect")
    .attr("class", "gene")
    .attr("id", (d, i) => `${sanitizeId(d.cluster)}-gene-${i}`)
    .attr("rowID", (d, i) => `${d["rowID"]}`)
    .attr("x", (d, i) => getAttributesForIndex(d, i).xPosStart)
    .attr("y", (d, i) => getAttributesForIndex(d, i).yPos)
    .attr("width", (d, i) => getAttributesForIndex(d, i).rectWidth)
    .attr("height", height)
    .attr("fill", (d) => colorScale(d[group]))
    .attr("stroke", stroke)
    .attr("stroke-width", strokeWidth)
    .style("cursor", cursor)
    .each(function (d, i) {
      const currentElement = d3.select(this);
      setAttributesFromOptions(currentElement, additionalOptions);
      applyStyleToElement(currentElement, itemStyle, i);
    });

  // Update the reference
  this.genes = g.selectAll(".gene");

  return this;
};
*/

clusterContainer.prototype.coordinates = function(show = true, options = {}) {
    if (!show) {
        return this;
    }

    const defaultOptions = {
        rotate: -45,
        yPositionTop: 55,
        yPositionBottom: 45,
        tickValuesTop: null,
        tickValuesBottom: null,
        overlapPercentage: 2,
        trackSpacing: 40,
        tickStyle: {
          stroke: "black",
          strokeWidth: 1,
          lineLength: 6
        },
        textStyle: {
          fill: "black",
          fontSize: "10px",
          fontFamily: "Arial",
          cursor: "default"
        }
    };

    const combinedOptions = mergeOptions.call(this, defaultOptions, 'coordinatesOptions', options);
    const { rotate, tickValuesTop, yPositionTop,  yPositionBottom, tickValuesBottom, trackSpacing, tickStyle, textStyle } = combinedOptions;

    // Extract additional options that are not in defaultOptions
    const additionalOptionsTickStyle = extractAdditionalOptions(tickStyle, defaultOptions.tickStyle);
    const additionalOptionsTextStyle = extractAdditionalOptions(textStyle, defaultOptions.textStyle);


    const g = this.svg.append("g")
        .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

    // Convert provided tickValues to the required format
    let tickValuesTopFinal = Array.isArray(tickValuesTop) ? tickValuesTop.map(value => ({ value, rowID: null }))
                         : (tickValuesTop != null ? [{ value: tickValuesTop, rowID: null }] : []);
    let tickValuesBottomFinal = Array.isArray(tickValuesBottom) ? tickValuesBottom.map(value => ({ value, rowID: null }))
                          : (tickValuesBottom != null ? [{ value: tickValuesBottom, rowID: null }] : []);

    // If neither tickValuesTop nor tickValuesBottom are provided, calculate them
    if (!tickValuesTop && !tickValuesBottom) {

    let allTickValues = this.data.reduce((acc, d) => {
        // Define tickValueStart and tickValueStop
        let tickValueStart = { value: d.start, rowID: d.rowID };
        let tickValueStop = { value: d.stop, rowID: d.rowID };

        // Add geneTrack property if it exists
        if ('geneTrack' in d) {
            tickValueStart.geneTrack = d.geneTrack;
            tickValueStop.geneTrack = d.geneTrack;
        }

        acc.push(tickValueStart);
        acc.push(tickValueStop);

        return acc;
    }, []);

    // Remove duplicates based on the 'value' property
    allTickValues = allTickValues.filter((obj, index, self) =>
    index === self.findIndex((t) => t.value === obj.value)
    );

        allTickValues.sort((a, b) => a.value - b.value);

        // Calculate overlap and distribute tick values between top and bottom
        const totalXValueRange = allTickValues[allTickValues.length - 1].value - allTickValues[0].value;
        const tickValueThreshold = totalXValueRange * (combinedOptions.overlapPercentage / 100);

        tickValuesBottomFinal = allTickValues.filter((tickObj, index, array) => {
            if (index === 0) return true;
            const diff = tickObj.value - array[index - 1].value;
            if (diff < tickValueThreshold) {
                tickValuesTopFinal.push(tickObj);
                return false;
            }
            return true;
        });
    }

    const self = this;

    // Create and configure the top axis
    const xAxisTop = g.append("g")
            .attr("transform", "translate(0," + this.yScale(yPositionTop) + ")")
            .call(d3.axisTop(this.xScale).tickValues(tickValuesTopFinal.map(t => t.value)));

        xAxisTop.selectAll(".tick")
          .data(tickValuesTopFinal)
          .attr("rowID", d => d.rowID)
          .attr("transform", function(d) {
              const xOffset = self.xScale(d.value);
              currentTrackOffset = d.geneTrack ? -(d.geneTrack - 1) * trackSpacing : 0;
           return "translate(" + xOffset + ","  +  currentTrackOffset  + ")";
        });

        xAxisTop.select(".domain").attr("stroke", "none");

        xAxisTop.selectAll("text")
            .data(tickValuesTopFinal)
            .attr("class", "coordinate")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".4em")
            .attr("transform", "rotate(" + (-rotate) + ")")
            .style("fill", textStyle.fill)
            .style("font-size", textStyle.fontSize)
            .style("font-family", textStyle.fontFamily)
            .style("cursor", textStyle.cursor)
            .each(function() {
                const currentElement = d3.select(this);
                setAttributesFromOptions(currentElement, additionalOptionsTextStyle);
            });

        xAxisTop.selectAll(".tick line")
            .style("stroke", tickStyle.stroke)
            .style("stroke-width", tickStyle.strokeWidth)
            .attr("y2", -tickStyle.lineLength)
            .each(function() {
                const currentElement = d3.select(this);
                setAttributesFromOptions(currentElement, additionalOptionsTickStyle);
            });



    // Create and configure the bottom axis
    const xAxisBottom = g.append("g")
            .attr("transform", "translate(0," + this.yScale(yPositionBottom) + ")")
            .call(d3.axisBottom(this.xScale).tickValues(tickValuesBottomFinal.map(t => t.value)));

        xAxisBottom.selectAll(".tick")
            .data(tickValuesBottomFinal)
            .attr("rowID", d => d.rowID)
            .attr("transform", function(d) {
              const xOffset = self.xScale(d.value);
              currentTrackOffset = d.geneTrack ? -(d.geneTrack - 1) * trackSpacing : 0;
           return "translate(" + xOffset + ","  +  currentTrackOffset  + ")";
        });

        xAxisBottom.select(".domain").attr("stroke", "none");

        xAxisBottom.selectAll("text")
            .data(tickValuesBottomFinal)
            .attr("class", "coordinate")
            .style("text-anchor", "start")
            .attr("dx", ".8em")
            .attr("dy", "-.15em")
            .attr("transform", "rotate(" + (-rotate) + ")")
            .style("fill", textStyle.fill)
            .style("font-size", textStyle.fontSize)
            .style("font-family", textStyle.fontFamily)
            .style("cursor", textStyle.cursor)
            .each(function() {
                const currentElement = d3.select(this);
                setAttributesFromOptions(currentElement, additionalOptionsTextStyle);
            });

        xAxisBottom.selectAll(".tick line")
            .style("stroke", tickStyle.stroke)
            .style("stroke-width", tickStyle.strokeWidth)
            .attr("y2", tickStyle.lineLength)
            .each(function() {
                const currentElement = d3.select(this);
                setAttributesFromOptions(currentElement, additionalOptionsTickStyle);
            });

    return this;
};

clusterContainer.prototype.scaleBar = function(show = true, options = {}) {
  if (!show) {
    return this;
  }

  const defaultOptions = {
    title: "1 kb",
    scaleBarUnit: 1000,
    x: 0, // default x offset
    y: 10,
    labelStyle: { // default styling for the label
      fontSize: "10px",
      fontFamily: "sans-serif",
      cursor: "default",
      fill: "black", // default text color
      labelPosition: "left" // moved labelPosition into labelStyle
    },
    textPadding: 0, // padding between text and line in x-direction
    scaleBarLineStyle: { // default styling for the scale bar line
      stroke: "grey",
      strokeWidth: 1
    },
    scaleBarTickStyle: { // default styling for the scale bar ticks
      stroke: "grey",
      strokeWidth: 1
    }
  };

  // Merge the default options with any predefined scaleBarOptions and the provided options
  const combinedOptions = mergeOptions.call(this, defaultOptions, 'scaleBarOptions', options);
  const { title, scaleBarUnit, x, y, textPadding, labelStyle, scaleBarLineStyle, scaleBarTickStyle } = combinedOptions;

  // Extract additional options that are not in defaultOptions
  const additionalOptionsLine = extractAdditionalOptions(scaleBarLineStyle, defaultOptions.scaleBarLineStyle);
  const additionalOptionsTick = extractAdditionalOptions(scaleBarTickStyle, defaultOptions.scaleBarTickStyle);
  const additionalOptionsLabel = extractAdditionalOptions(labelStyle, defaultOptions.labelStyle);

  // Calculate the length of the scale bar in pixels
  const scaleBarLength = this.xScale(scaleBarUnit) - this.xScale(0);

  // Create the group with the x offset applied
  const g = this.svg.append("g")
    .attr("transform", `translate(${this.width - this.margin.right - scaleBarLength - parseInt(labelStyle.fontSize) - 5 + x}, ${this.height - this.margin.bottom})`);

  // Create the scale bar line
  g.append("line")
    .attr("x1", parseInt(labelStyle.fontSize) + 5 + scaleBarLength)
    .attr("x2", parseInt(labelStyle.fontSize) + 5)
    .attr("y1", -y)
    .attr("y2", -y)
    .style("stroke", scaleBarLineStyle.stroke)
    .style("stroke-width", scaleBarLineStyle.strokeWidth)
    .each(function() {
      const currentElement = d3.select(this);
      setAttributesFromOptions(currentElement, additionalOptionsLine);
    });

  // Add the ticks
  [parseInt(labelStyle.fontSize) + 5, parseInt(labelStyle.fontSize) + 5 + scaleBarLength].forEach(d => {
    g.append("line")
      .attr("x1", d)
      .attr("x2", d)
      .attr("y1", -y - 5)
      .attr("y2", -y + 5)
      .style("stroke", scaleBarTickStyle.stroke)
      .style("stroke-width", scaleBarTickStyle.strokeWidth)
      .each(function() {
        const currentElement = d3.select(this);
        setAttributesFromOptions(currentElement, additionalOptionsTick);
      });
  });

  // Determine the x position of the title based on the labelPosition within labelStyle and adjust with textPadding
  const titleX = labelStyle.labelPosition === "left" ? (parseInt(labelStyle.fontSize) - textPadding) : (parseInt(labelStyle.fontSize) + 5 + scaleBarLength + textPadding);
  const textAnchor = labelStyle.labelPosition === "left" ? "end" : "start";

  // Add the title
  g.append("text")
    .attr("x", titleX)
    .attr("y", -y)
    .style("text-anchor", textAnchor)
    .style("dominant-baseline", "middle")
    .style("font-size", labelStyle.fontSize)
    .style("font-family", labelStyle.fontFamily)
    .style("cursor", labelStyle.cursor)
    .style("fill", labelStyle.fill) // Apply text color
    .each(function() {
      const currentElement = d3.select(this);
      setAttributesFromOptions(currentElement, additionalOptionsLabel);
    })
    .text(title);

  return this;
};

clusterContainer.prototype.labels = function (label, show = true, options = {}) {

  if (!show) {
    return this;
  }

  // Verify that the data exists
  if (!this.data) {
    console.error('No data has been added to this cluster container. Please use the addGeneData() function before attempting to draw genes.');
    return this;
  }

  const defaultOptions = {
    x: 0,
    y: 50,
    dy: "-1.2em",
    dx: "0em",
    rotate: 0,
    start: null,
    stop: null,
    adjustLabels: true,
    trackSpacing: 40,
    fontSize: "12px",
    fontStyle: "italic",
    fontFamily: "sans-serif",
    textAnchor: "middle",
    cursor: "default",
    labelAdjustmentOptions: {
      rotation: 65,
      dx: "-0.8em",
      dy: "0.15em"
    },
    itemStyle: [] // [{"index": 3,"y": 20}]
  };

  // If theme options exist, use them as the default options
  if (this.themeOptions && this.themeOptions.labelsOptions) {
    options = { ...this.themeOptions.labelsOptions, ...options };
  }

  const combinedOptions = { ...defaultOptions, ...options };
  const { x, y, start, stop, adjustLabels, trackSpacing, labelAdjustmentOptions, itemStyle, dx, dy, anchor, rotate, fontSize, fontStyle, fontFamily, textAnchor, cursor} = combinedOptions;

  // Extract additional options that are not in defaultOptions
  const additionalOptions = extractAdditionalOptions(combinedOptions, defaultOptions);

  // Placeholder function for getUniqueId
  const getUniqueId = (label) => label; // Replace with your actual implementation

  // Create the group
  const g = this.svg.append("g")
    .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

   // Sort the data first by the minimum value of start and stop.
  this.data.sort((a, b) => Math.min(a.start, a.stop) - Math.min(b.start, b.stop));

    // Check for existing labels
  const existingLabels = g.selectAll("text.label");

  const getAttributesForIndex = (d, i) => {
    const style = itemStyle.find(s => s.index === i) || {};
    const currentX = style.x || x;
    const currentY = style.y || y;

    const currentDx = style.dx || dx;
    const currentDy = style.dy || dy;
    const currentRotate = style.rotate || rotate;
    const currentLabelAdjustmentOptions = style.labelAdjustmentOptions || undefined;
    const currentAdjustLabels = style.adjustLabels !== undefined ? style.adjustLabels : adjustLabels;

    const xPos = this.xScale((d.start + d.stop) / 2) + currentX;

    const currentTrackOffset = d.geneTrack ? (d.geneTrack - 1) * trackSpacing : 0;
    const yPos = this.yScale(currentY) - currentTrackOffset;

    return {
        xPos,
        yPos,
        dx: currentDx,
        dy: currentDy,
        rotate: currentRotate,
        labelAdjustmentOptions: currentLabelAdjustmentOptions,
        adjustLabels: currentAdjustLabels
    };
  };

  const self = this;
  // Adding the Label
  g.selectAll("text.label")
    .data(this.data)
    .enter()
    .append("text")
    .attr("id", (d, i) => `cluster-${sanitizeId(d.cluster)}-label-${i}`)
    .attr("rowID", (d, i) => `${d["rowID"]}`)
    .attr("class", "label")
    .attr("x", (d, i) => getAttributesForIndex(d, i).xPos)
    .attr("y", (d, i) => getAttributesForIndex(d, i).yPos)
    .attr("dx", (d, i) => getAttributesForIndex(d, i).dx)
    .attr("dy", (d, i) => getAttributesForIndex(d, i).dy)
    .attr("text-anchor", textAnchor)
    .attr("transform", (d, i) => {
    const xPos = getAttributesForIndex(d, i).xPos;
    const yPos = getAttributesForIndex(d, i).yPos;
    const rotateValue = getAttributesForIndex(d, i).rotate;
    return `rotate(${rotateValue}, ${xPos}, ${yPos})`;
  })
    .style("font-size", fontSize)
    .style("font-style", fontStyle)
    .style("font-family", fontFamily)
    .style("cursor", cursor)
    .text(d => d[label])
    .each(function(d, i) {

      const currentElement = d3.select(this);
      const attributes = getAttributesForIndex(d, i);

     if (attributes.adjustLabels) {
        adjustSpecificLabel(self, "text.label", currentElement.attr("id"), attributes.labelAdjustmentOptions);
     }
      // Set additional options as attributes
      setAttributesFromOptions(currentElement, additionalOptions);
      // Override with itemStyle based on the index
      applyStyleToElement(currentElement, itemStyle, i);

      // Adjust labels if needed
     if (attributes.labelAdjustmentOptions) {

        const { rotation, dx, dy } = attributes.labelAdjustmentOptions;
        const x = parseFloat(currentElement.attr('x'));
        const y = parseFloat(currentElement.attr('y'));

        currentElement
          .attr("dx", dx)
          .attr("dy", dy)
          .attr("transform", `rotate(${rotation}, ${x}, ${y})`);
      }

    });

  //Make markers available to tooltip
  this.labels = g.selectAll(".label");

  return this;
};

clusterContainer.prototype.tooltip = function(show = true, options = {}) {
    if (!show) {
        return this;
    }

    const defaultOptions = {
        triggers: ["markers", "genes", "labels"],
        formatter: "<b>Start:</b> {start}<br><b>Stop: {stop}</b>",
        opacity: 0,
        position: "absolute",
        backgroundColor: "rgba(255, 255, 255, 0.9)",
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
    };

    // If theme options exist, use them as the default options
    if (this.themeOptions && this.themeOptions.tooltipOptions) {
        options = { ...this.themeOptions.tooltipOptions, ...options };
    }

    const combinedOptions = { ...defaultOptions, ...options };

    // Extract additional options that are not in defaultOptions
   const additionalOptions = extractAdditionalOptions(combinedOptions, defaultOptions);


    // Generate CSS for the tooltip and its pseudo-element
    const generateTooltipCSS = (opts, additionalOpts) => {
        let additionalStyles = Object.entries(additionalOpts).map(([key, value]) => `${camelToKebab(key)}: ${value};`).join(' ');
        return `
            .cluster-tooltip {
                ${additionalStyles}
                opacity: ${opts.opacity};
                position: ${opts.position};
                background-color: ${opts.backgroundColor};
                padding: ${opts.padding};
                border-radius: ${opts.borderRadius};
                border: ${opts.border};
                box-shadow: ${opts.boxShadow};
                pointer-events: ${opts.pointerEvents};
                font-family: ${opts.fontFamily};
                font-size: ${opts.fontSize};
                z-index: ${opts.zIndex};
                color: ${opts.color};
                line-height: ${opts.lineHeight};
            }
            .cluster-tooltip::before {
                content: "";
                position: absolute;
                top: 100%;
                left: 50%;
                transform: translateX(-50%);
                border-width: 5px;
                border-style: solid;
                border-color: ${opts.backgroundColor} transparent transparent transparent;
            }
        `;
    };

    // Inject the generated CSS into the document
    const styleTag = document.createElement("style");
    styleTag.innerHTML = generateTooltipCSS(combinedOptions, additionalOptions);
    document.head.appendChild(styleTag);

    // Ensure triggers is an array
    if (typeof combinedOptions.triggers === 'string') {
        combinedOptions.triggers = [combinedOptions.triggers];
    }

    // Create the tooltip div if it doesn't exist
    let tooltip = d3.select("body").select(".cluster-tooltip");
    if (tooltip.empty()) {
        tooltip = d3.select("body")
            .append("div")
            .attr("class", "cluster-tooltip")
            .style("opacity", combinedOptions.opacity)
            .style("position", combinedOptions.position)
            .style("background-color", combinedOptions.backgroundColor)
            .style("padding", combinedOptions.padding)
            .style("border-radius", combinedOptions.borderRadius)
            .style("border", combinedOptions.border)
            .style("box-shadow", combinedOptions.boxShadow)
            .style("pointer-events", combinedOptions.pointerEvents)
            .style("font-family", combinedOptions.fontFamily)
            .style("font-size", combinedOptions.fontSize)
            .style("z-index", combinedOptions.zIndex)
            .style("color", combinedOptions.color)
            .style("line-height", combinedOptions.lineHeight);
    }

    // Function to generate tooltip content
    const d3Format = d3.format(",");

    const textAccessor = (d) => {
        return combinedOptions.formatter.replace(/\{(\w+)\}/g, (match, p1) => {
            if (typeof d[p1] === 'number') {
                return d3Format(d[p1]);
            }
            return d[p1] || '';
        });
    };

    combinedOptions.triggers.forEach(trigger => {

    if (!this.hasOwnProperty(trigger)) {
         return;
    }

    const selection = this[trigger];

    // Check if the selection exists and is not empty
    if (!selection || selection.empty()) {
        return; // Skip this iteration of the loop
    }

    // Mouseover event to show the tooltip
    selection.on("mouseover", (event, d) => {
        const dataPoint = this.data.find(item => item === d);
        const x = event.pageX;
        const y = event.pageY;

        const element = d3.select(event.currentTarget);
        element.classed("hovered", true);

        tooltip.transition()
            .duration(200)
            .style("opacity", 1);
        tooltip.html(textAccessor(dataPoint))
            .style("left", (x - tooltip.node().offsetWidth / 2) + "px")
            .style("top", (y - tooltip.node().offsetHeight - 15) + "px");
    });

    // Mousemove event to reposition the tooltip as the mouse moves
    selection.on("mousemove", (event, d) => {
        const x = event.pageX;
        const y = event.pageY;

        tooltip.style("left", (x - tooltip.node().offsetWidth / 2) + "px")
            .style("top", (y - tooltip.node().offsetHeight - 15) + "px");
    });

    // Mouseout event to hide the tooltip
    selection.on("mouseout", () => {

        const element = d3.select(event.currentTarget);
        element.classed("hovered", false);

        tooltip.transition()
            .duration(500)
            .style("opacity", 0);
    });
});

    return this; // Return the instance for method chaining
};

function legendContainer(svg, margin, width, height) {
  this.svg = svg;
  this.margin = margin;
  this.width = width;
  this.height = height;
}

function createLegendContainer(targetElementId, options = {}) {

  const defaultOptions = {
    id: "svg-legend-container",
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    backgroundColor: "white",
    width: null,
    height: null
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    margin: { ...defaultOptions.margin, ...options.margin }
  };

  const { id, backgroundColor, width, height, margin } = mergedOptions;

  var svg = d3.select(targetElementId)
    .append("svg")
    .attr("id", getUniqueId(id))
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .classed("GCVieweR-svg-content", true)
    .style("background-color", backgroundColor);

  return new legendContainer(svg, margin, width, height);
}

legendContainer.prototype.legendData = function (data) {

  this.data = [...new Set(data)];

  return this;

};

legendContainer.prototype.legend = function(group, show = true, options = {}) {

  if (!show) {
    return this;
  }

  const defaultOptions = {
    x: 10,
    y: 10,
    orientation: "horizontal",
    adjustHeight: true,
    labels: null, // Add labels option here
    legendOptions: {
      cursor: "pointer",
      colorScheme: null,
      customColors: null
    },
    legendTextOptions: {
      cursor: "pointer",
      textAnchor: "start",
      dy: ".35em",
      fontSize: "12px",
      fontFamily: "sans-serif"
    }
  };

  if (this.themeOptions && this.themeOptions.legendOptions) {
    options = { ...this.themeOptions.legendOptions, ...options };
  }

  const combinedOptions = {
    ...defaultOptions,
    ...options,
    legendOptions: { ...defaultOptions.legendOptions, ...options.legendOptions },
    legendTextOptions: { ...defaultOptions.legendTextOptions, ...options.legendTextOptions }
  };

  const { x, y, orientation, adjustHeight, legendOptions, legendTextOptions, labels } = combinedOptions;

  const additionalOptionsLegend = extractAdditionalOptions(legendOptions, defaultOptions.legendOptions);
  const additionalOptionsLegendText = extractAdditionalOptions(legendTextOptions, defaultOptions.legendTextOptions);

  const svgLegend = this.svg;
  const parentWidth = svgLegend.node().getBoundingClientRect().width;

  var g = svgLegend.append("g")
    .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

  const uniqueGroups = labels || [...new Set(this.data.map(d => d[group]))];


  if (!uniqueGroups.length) {
    console.error(`Error: No labels provided and the group "${group}" does not exist in the data.`);
    return;
  }

  const colorScale = getColorScale(legendOptions.colorScheme, legendOptions.customColors, uniqueGroups);

  const legendSize = parseFloat(legendTextOptions.fontSize);
  const legendPadding = legendSize / 2;
  let currentX = x;
  let currentY = y;

  g.selectAll(".legend")
    .data(uniqueGroups)
    .enter()
    .append("g")
    .attr("class", "legend")
    .each((d, i, nodes) => {
      const legendGroup = d3.select(nodes[i]);

      const textLabel = legendGroup
        .append("text")
        .attr("class", "legend-label")
        .attr("id", (d, i) => `legend-label-${i}`)
        .attr("dy", legendTextOptions.dy)
        .style("text-anchor", legendTextOptions.textAnchor)
        .style("font-size", legendTextOptions.fontSize)
        .style("font-family", legendTextOptions.fontFamily)
        .style("cursor", legendTextOptions.cursor)
        .text(d)
        .each(function() {
          const currentElement = d3.select(this);
          setAttributesFromOptions(currentElement, additionalOptionsLegendText);
        });

      const textLength = textLabel.node().getComputedTextLength();

      if (currentX + textLength + legendSize + 2 * legendPadding > parentWidth - this.margin.left - this.margin.right) {
        currentX = x;
        currentY += legendSize + legendPadding;
      }

      textLabel
        .attr("x", currentX + legendSize + legendPadding)
        .attr("y", currentY + legendSize / 2);

      const rect = legendGroup
        .append("rect")
        .attr("class", "legend-marker")
        .attr("id", (d, i) => `legend-marker-${i}`)
        .style("cursor", legendOptions.cursor)
        .attr("x", currentX)
        .attr("y", currentY)
        .attr("width", legendSize)
        .attr("height", legendSize)
        .style("fill", colorScale(d))
        .each(function() {
          const currentElement = d3.select(this);
          setAttributesFromOptions(currentElement, additionalOptionsLegend);
        });

      if (orientation === "horizontal") {
        currentX += textLength + legendSize + 2 * legendPadding;
      } else {
        currentX = x;
        currentY += legendSize + legendPadding;
      }

    })
    .on("mouseover", (event, d) => {
        const element = d3.select(event.currentTarget);
        element.classed("hovered", true);
    })
    .on("mouseout", (event, d) => {
        const element = d3.select(event.currentTarget);
        element.classed("hovered", false);
    })
    .on("click", (event, d) => {
        const element = d3.select(event.currentTarget);
        // If it's currently highlighted, unhighlight it, else highlight it
        if(element.classed("unselected")) {
            element.classed("unselected", false);
        } else {
            element.classed("unselected", true);
    }

    const unselectedLegend = d3.selectAll(".unselected").data();
    const unselectedRowIds = this.data
      .filter(item => unselectedLegend.includes(item[group]))
      .map(item => item.rowID);

    // For all elements with a rowID attribute:
    d3.selectAll('[rowID]').each(function() {
        const currentRowID = +d3.select(this).attr("rowID"); // Convert string to number
        if (unselectedRowIds.includes(currentRowID)) {
            d3.select(this).style("display", "none"); // Hide it
        } else {
            d3.select(this).style("display", ""); // Show it
        }
    });
});

  if (adjustHeight && this.height === 0) {
    var contentHeight = currentY + legendSize + legendPadding;
    svgLegend.attr("height", contentHeight);
    var viewBoxWidth = svgLegend.node().getBoundingClientRect().width;
    svgLegend.attr("viewBox", `0 0 ${viewBoxWidth} ${contentHeight}`);
  }

  return this;
};

clusterContainer.prototype.genes = function(group, show = true, options = {}) {

    if (!show) {
        return this;
    }

    if (!this.data) {
        console.error('No data has been added to this cluster container. Please use the geneData() function before attempting to draw arrows.');
        return this;
    }

    const defaultOptions = {
        x: 1,
        y: 50,
        stroke: "black",
        strokeWidth: 1,
        colorScheme: null,
        customColors: null,
        cursor: "default",
        itemStyle: [],
        arrowheadWidth: 10,
        arrowheadHeight: 20,
        arrowHeight: 10,
        trackSpacing: 40
    };

    const combinedOptions = mergeOptions.call(this, defaultOptions, 'geneOptions', options);
    const { x, y, stroke, strokeWidth, colorScheme, customColors, cursor, itemStyle, arrowheadWidth, arrowheadHeight, arrowHeight, trackSpacing } = combinedOptions;

    // Extract additional options that aren't in defaultOptions
    const additionalOptions = extractAdditionalOptions(combinedOptions, defaultOptions);

    const uniqueGroups = [...new Set(this.dataAll.map(d => d[group]))];

    const colorScale = getColorScale(colorScheme, customColors, uniqueGroups);

    var g = this.svg.append("g")
        .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);

    // Sort the data first by the minimum value of start and stop.
    this.data.sort((a, b) => Math.min(a.start, a.stop) - Math.min(b.start, b.stop));
    this.trackOffset = (arrowHeight + trackSpacing)

    const getAttributesForIndex = (d, i) => {
        const style = itemStyle.find(s => s.index === i) || {};
        // Apply custom values from itemStyle or default if not provided
        const currentArrowheadWidth = style.arrowheadWidth || arrowheadWidth;
        const currentArrowheadHeight = style.arrowheadHeight || arrowheadHeight;
        const currentArrowHeight = style.arrowHeight || arrowHeight;
        const currentX = style.x || x;
        const currentY = style.y || y;
        // Calculate Y position based on geneTrack
        const currentTrackOffset = d.geneTrack ? (d.geneTrack - 1) * trackSpacing : 0;

        const yPos = this.yScale(currentY) - currentTrackOffset;
        const xPos = this.reverse ? this.xScale(d.stop) : this.xScale(d.start);

        return { xPos, yPos, currentArrowheadWidth, currentArrowheadHeight, currentArrowHeight };
    };

    g.selectAll(".gene")
        .data(this.data)
        .enter()
        .append("path")
        .attr("d", (d, i) => {

            const { currentArrowheadWidth, currentArrowheadHeight, currentArrowHeight } = getAttributesForIndex(d, i);
            const geneLength = Math.abs(this.xScale(d.stop) - this.xScale(d.start));
            let shaftLength = geneLength - currentArrowheadWidth;
            shaftLength = Math.max(0, shaftLength);

            const shaftTop = (currentArrowheadHeight - currentArrowHeight) / 2;
            const shaftBottom = shaftTop + currentArrowHeight;

            const shaftPath =
            `M0 ${shaftTop}
            L0 ${shaftBottom}
            L${shaftLength} ${shaftBottom}
            L${shaftLength} ${currentArrowheadHeight}
            L${geneLength} ${(currentArrowheadHeight / 2)}
            L${shaftLength} 0
            L${shaftLength} ${shaftTop} Z`;

            return shaftPath;
        })
        .attr("transform", (d, i) => {
            const { xPos, yPos, currentArrowheadHeight } = getAttributesForIndex(d, i);
            const rotation = d.direction === 'forward' ? 0 : 180;
            return `rotate(${rotation}, ${xPos}, ${yPos}) translate(${xPos}, ${yPos - (currentArrowheadHeight / 2)})`;
        })
        .attr("fill", (d) => colorScale(d[group]))
        .attr("class", "gene")
        .attr("id", (d, i) => `${sanitizeId(d.cluster)}-gene-${i}`)
        .attr("rowID", (d, i) => `${d["rowID"]}`)
        .style("stroke-width", strokeWidth)
        .style("stroke", stroke)
        .style("cursor", cursor)
        .each(function (d, i) {
            const currentElement = d3.select(this);

            // Set additional options as attributes
            setAttributesFromOptions(currentElement, additionalOptions);

            // Override with itemStyle based on the index
            applyStyleToElement(currentElement, itemStyle, i);
        });

    // Update the reference
    this.genes = g.selectAll(".gene");

    return this;
};
