# ------------------------------------------------------- #
#### Config ####
# ------------------------------------------------------- #
# simulation settings
initialConfig = list(
  nTrials = 10,
  maxNTrials = 20,
  toggleIntervention = F, # enable or disable the intervention (app) in the simulation
  
  # model config
  nPlaces = 6,
  nPeople = 40,
  totalTime = 20,
  initialInfected = 0.05,
  activeTime = 8,
  infectionProb = 0.25, # probability of being infected when exposed
  diagnosisPeriod = 3,
  isolationCompliance = 1,
  
  # intervention config
  estimatedDiagnosisPeriod = 3, # how far back in time to assume infection upon discovery
  estimatedActiveTime = 8,
  interventionUsage = 0.5
)

# ------------------------------------------------------- #
#### Libraries ####
# ------------------------------------------------------- #
library(igraph)

# ------------------------------------------------------- #
#### Methods ####
# ------------------------------------------------------- #

flaggedRisk = function(personIndex, t, context, config) {
  # This is how the app would assess each person's risk
  # Or at least a simplified version of it
  lastEvent = getVertexIndex(context$peopleLocations[personIndex], t, config)
  exposureTable = distances(context$appExposureNetwork, to=lastEvent, mode = 'out')
  isRisk = F
  eventsInRange = subset(context$flaggedExposeEvents, (t - context$flaggedExposeEvents$time) < config$estimatedActiveTime)
  for (flaggedEvent in unique(eventsInRange$v)) {
    exposeDistance = exposureTable[flaggedEvent]
    if (!(exposeDistance %in% c(0, Inf))) {
      isRisk = T
    }
  }
  return(isRisk)
}

booleanProb = function(probTrue, n=1) {
  sample(c(T,F), n, replace=T, c(probTrue, 1 - probTrue))
}

updatePersonAtHome = function(personIndex, t, context, config) {
  atHomeForInfection = isActiveInfected(personIndex, context, config, t) &
    isAwareInfection(personIndex, t, context, config) &
    booleanProb(config$isolationCompliance)
  atHomeForIntervention = t > 1 &
    config$toggleIntervention &
    context$usesIntervention[personIndex] &
    flaggedRisk(personIndex, t, context, config)
  return(atHomeForInfection | atHomeForIntervention)
}

updatePersonLocation = function(personIndex, context, config) {
  return(sample(1:config$nPlaces, 1, replace=T, context$placeProbabilities[personIndex,]))
}

getPlaceProbabilities = function(personIndex, context, config) {
  weights = rep(0, config$nPlaces)
  personHome = context$peopleHomes[personIndex]
  for (placeIndex in 1:length(context$placePopularities)) {
    placePopularity = context$placePopularities[placeIndex]
    distanceA = (context$peopleHomes[personIndex] - placeIndex) %% config$nPlaces
    distanceB = (placeIndex - context$peopleHomes[personIndex]) %% config$nPlaces
    distance = min(distanceA, distanceB)
    weights[placeIndex] = ifelse(distance == 0, placePopularity, placePopularity / distance)
  }
  return(weights / sum(weights))
}

isActiveInfected = function(personIndex, context, config, t) {
  return(
    context$infected[personIndex] &
      (t - context$infectedTime[personIndex] <= config$activeTime)
  )
}

isExposed = function(personIndex, context) {
  return(
    !context$infected[personIndex] &
      !context$peopleAtHome[personIndex] &
      context$peopleLocations[personIndex] %in% context$exposedPlaces
  )
}

addLayer = function(network, context, config, t) {
  network = add.vertices(network, config$nPlaces)
  nVertices = vcount(network)
  for (p in 1:config$nPlaces) {
    v = nVertices - config$nPlaces + p
    network = set_vertex_attr(network, 't', index=v, t)
    network = set_vertex_attr(network, 'place', index=v, p)
  }
  return(network)
}

getVertexIndex = function(location, t, config) {
  return((t - 1) * config$nPlaces + location)
}

logMovement = function(network, personIndex, currentMoveTime, previousLocation, previousMoveTime, context, config) {
  currentLocation = context$peopleLocations[personIndex]
  fromIndex = getVertexIndex(previousLocation, previousMoveTime, config)
  toIndex = getVertexIndex(currentLocation, currentMoveTime, config)
  network = add_edges(network, c(fromIndex, toIndex))
  return(network)
}

logExposeEvents = function(context, config) {
  newEvents = c()
  uniqueExposedPlaces = unique(context$exposedPlaces)
  for (p in 1:config$nPlaces) {
    newEvents = append(newEvents, p %in% uniqueExposedPlaces)
  }
  return(newEvents)
}

isAwareInfection = function(personIndex, t, context, config) {
  return(t - context$infectedTime[personIndex] >= config$diagnosisPeriod)
}

flagInfection = function(personIndex, t, context, config) {
  # person assumes they have had infection for some time
  if (context$usesIntervention[personIndex] & !context$hasFlaggedInfection[personIndex]) {
    for (u in max(t - config$estimatedDiagnosisPeriod, 1):t) {
      flaggedLocation = context$locationHistory[u, personIndex]
      context$flaggedExposeEvents = rbind(context$flaggedExposeEvents, list(time=t, v=getVertexIndex(flaggedLocation, u, config)))
      context$hasFlaggedInfection[personIndex] = T
    }
  }
  return(context$flaggedExposeEvents)
}

setConfig = function(input) {
  return(list(
    nTrials = input$nTrials,
    toggleIntervention = input$toggleIntervention,
    genPlot = initialConfig$genPlot,
    
    # model config
    nPlaces = initialConfig$nPlaces,
    nPeople = initialConfig$nPeople,
    totalTime = initialConfig$totalTime,
    initialInfected = initialConfig$initialInfected,
    activeTime = input$activeTime,
    infectionProb = input$infectionProb,
    diagnosisPeriod = input$diagnosisPeriod,
    isolationCompliance = initialConfig$isolationCompliance,
    
    # intervention config
    estimatedDiagnosisPeriod = input$estimatedDiagnosisPeriod,
    estimatedActiveTime = input$estimatedActiveTime,
    interventionUsage = input$interventionUsage
  ))
}

# ------------------------------------------------------- #
#### Model ####
# ------------------------------------------------------- #
modelFn = function(input, toggleDummy = F) {
  config = setConfig(input)
  simulationResults = list()
  infectionCurve = data.frame()
  infectionCurveParticipate = data.frame()
  infectionCurveAbstain = data.frame()
    # matrix(nrow=as.numeric(config$nTrials), ncol=as.numeric(config$totalTime))
  for (q in 1:config$nTrials) {
    # infection model
    infectedN = ceiling(config$initialInfected * config$nPeople)
    infected = rep(F, nPeople)
    for (i in 1:nPeople) {
      infected[i] = (i <= infectedN)
    }
    context = list(
      infected = infected,
      infectedStart = length(infected[infected]),
      placePopularities = rbeta(config$nPlaces, 2, 2),
      peopleHomes = floor(runif(config$nPeople, min=0, max=config$nPlaces)),
      peopleLocations = floor(runif(config$nPeople, min=1, max=config$nPlaces)),
      locationHistory = matrix(nrow=config$totalTime, ncol=config$nPeople),
      lastMovedTime = rep(1, config$nPeople),
      peopleAtHome = rep(NA, config$nPeople),
      infectedTime = ifelse(infected, 0, NA),
      hasFlaggedInfection = rep(F, config$nPeople),
      exposeEvents = c(),
      placeProbabilities = matrix(nrow=config$nPeople, ncol=config$nPlaces),
      exposedPlaces = c(),
      movementNetwork = graph.empty(n=0, directed=T),
      
      # intervention model
      # the exposure network is a "layered" directed graph; represents data maintanined in the app network
      # each layer in the graph is a point in time
      # each node in each layer is a place
      # edges point only forward in time, from one place to another (can also point to same place in next time frame)
      # the edges represent movement of people across time
      # edges are allowed to skip layers. This happens when people stay home for that time frame.
      appExposureNetwork = graph.empty(n=0, directed=T),
      # These may or may not be true expose events
      # This represents the information that is available in the network
      flaggedExposeEvents = data.frame(time=integer(), v=double()),
      infectedMovements = c(), # for visualization
      usesIntervention = booleanProb(config$interventionUsage, n=config$nPeople)
    )
    
    for (personIndex in 1:config$nPeople) {
      context$placeProbabilities[personIndex,] = getPlaceProbabilities(personIndex, context, config)
    }

    for (t in 1:config$totalTime) {
      context$exposedPlaces = c()
      # add 1 vertex for each place for each layer; each layer represents a point in time
      context$movementNetwork = addLayer(context$movementNetwork, context, config, t)
      context$appExposureNetwork = addLayer(context$appExposureNetwork, context, config, t)
      for (personIndex in 1:config$nPeople) {
        # update locations (simulate movement)
        context$peopleAtHome[personIndex] = updatePersonAtHome(personIndex, t, context, config)
        personMoved = !context$peopleAtHome[personIndex]
        previousLocation = NA
        if (t > 1 & personMoved) {
          previousLocation = context$peopleLocations[personIndex]
          previousMoveTime = context$lastMovedTime[personIndex]
          context$peopleLocations[personIndex] = updatePersonLocation(personIndex, context, config)
          context$lastMovedTime[personIndex] = t
          # update exposure network
          context$movementNetwork = logMovement(context$movementNetwork, personIndex, t, previousLocation, previousMoveTime, context, config)
          if (context$usesIntervention[personIndex]) {
            context$appExposureNetwork = logMovement(context$appExposureNetwork, personIndex, t, previousLocation, previousMoveTime, context, config)
          }
          context$infectedMovements = append(context$infectedMovements, isActiveInfected(personIndex, context, config, t))
        }
        context$locationHistory[t,personIndex] = ifelse(personMoved, context$peopleLocations[personIndex], NA)
        if (isActiveInfected(personIndex, context, config, t)) {
          # if person is infected and active and not at home, they have exposed everyone at this location/point in time
          if (!context$peopleAtHome[personIndex]) {
            context$exposedPlaces = append(context$exposedPlaces, context$peopleLocations[personIndex])
          }
          if (isAwareInfection(personIndex, t, context, config)) {
            context$flaggedExposeEvents = flagInfection(personIndex, t, context, config)
          }
        }
      }
      for (personIndex in 1:config$nPeople) {
        if (isExposed(personIndex, context)) {
          # if person is in same time/place, they are exposed
          # probalistic infection
          context$infected[personIndex] = sample(booleanProb(config$infectionProb))
          if (context$infected[personIndex]) {
            # if infected, set time of infection
            context$infectedTime[personIndex] = t
          }
        }
      }
      context$exposeEvents = append(context$exposeEvents, logExposeEvents(context, config))
      activeInfectedParticipate = sapply(1:config$nPeople, function(i) { isActiveInfected(i, context, config, t) & context$usesIntervention[personIndex] })
      activeInfectedAbstain = sapply(1:config$nPeople, function(i) { isActiveInfected(i, context, config, t) & !context$usesIntervention[personIndex] })
      nActiveInfectedParticipate = length(activeInfectedParticipate[activeInfectedParticipate])
      nActiveInfectedAbstain = length(activeInfectedAbstain[activeInfectedAbstain])
      nActiveInfectedTotal = nActiveInfectedParticipate + nActiveInfectedAbstain
      infectionCurve = rbind(infectionCurve, list(trial=q, time=t, active=nActiveInfectedTotal / nPeople))
      infectionCurveParticipate = rbind(infectionCurve, list(trial=q, time=t, active=nActiveInfectedParticipate / nPeople))
      infectionCurveAbstain = rbind(infectionCurve, list(trial=q, time=t, active=nActiveInfectedAbstain / nPeople))
      if (config$nTrials == 1) {
        print(paste('t:', t, ', # active:', length(context$activeInfected[context$activeInfected])))
        print(paste('t:', t, ', # infected:', length(context$infected[context$infected])))
        print(paste('t:', t, ', # at home:', length(context$peopleAtHome[context$peopleAtHome])))
      }
    }
    activeInfected = sapply(1:config$nPeople, function(i) { isActiveInfected(i, context, config, t) })
    allInfected = length(context$infected[context$infected]) / config$nPeople

    simulationResults[[q]] = list(
      movementNetwork=context$movementNetwork,
      appExposureNetwork=context$appExposureNetwork,
      exposeEvents=context$exposeEvents,
      infectedMovements=context$infectedMovements,
      placePopularities=context$placePopularities,
      infected=allInfected,
      nPlaces=config$nPlaces,
      totalTime=config$totalTime,
      nTrials=config$nTrials,
      dummyOutput=toggleDummy
    )
  }
  return(list(
    infectionCurve=infectionCurve,
    infectionCurveParticipate=infectionCurveParticipate,
    infectionCurveAbstain=infectionCurveAbstain,
    simulationResults=simulationResults
  ))
}