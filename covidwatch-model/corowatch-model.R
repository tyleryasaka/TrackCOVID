# ------------------------------------------------------- #
#### Config ####
# ------------------------------------------------------- #

# simulation settings
nTrials = 20
toggleIntervention = F # enable or disable the intervention (app) in the simulation
genPlot = F

# model config
nPlaces = 5
nPeople = 40
totalTime = 20
initialInfected = 0.05
activeTime = 16
infectionProb = 0.1 # probability of being infected when exposed
probDiscoverInfection = 0.1 # dice rolled each time frame
isolationCompliance = 0.75

# intervention config
assumedTimeFromInfect = 20 # how far back in time to assume infection upon discovery
putativeInfectProb = 0.95 # the probability of infection on exposure as estimated by the app
riskToleranceThreshold = 0 # above this risk level, people stay home
interventionCompliance = 0.75

# ------------------------------------------------------- #
#### Libraries ####
# ------------------------------------------------------- #

library(igraph)

# ------------------------------------------------------- #
#### Methods ####
# ------------------------------------------------------- #

flaggedRisk = function(personIndex, t) {
  # This is how the app would assess each person's risk
  # Or at least a simplified version of it
  lastEvent = getVertexIndex(peopleLocations[personIndex], t)
  exposureTable = distances(exposureNetwork, to=lastEvent, mode = 'out')
  isRisk = F
  for (flaggedEvent in unique(flaggedExposeEvents)) {
    exposeDistance = exposureTable[flaggedExposeEvents[1]]
    if (!(exposeDistance %in% c(0, Inf))) {
      isRisk = T
    }
  }
  return(isRisk)
}

booleanProb = function(probTrue, n=1) {
  sample(c(T,F), n, replace=T, c(probTrue, 1 - probTrue))
}

updatePersonAtHome = function(personIndex, t) {
  if (isActiveInfected(personIndex) & infectionKnowledge[personIndex]) {
    return(booleanProb(isolationCompliance))
  } else if (t > 1 & toggleIntervention & flaggedRisk(personIndex, t - 1)) {
    # again this assumes 100% compliance
    return(booleanProb(interventionCompliance))
  } else {
    return(F)
  }
}

updatePersonLocation = function(personIndex) {
  return(sample(1:nPlaces, 1, replace=T, placeProbabilities[personIndex,]))
}

getPlaceProbabilities = function(personIndex) {
  weights = rep(0, nPlaces)
  personHome = peopleHomes[personIndex]
  for (placeIndex in 1:length(placePopularities)) {
    placePopularity = placePopularities[placeIndex]
    distanceA = (peopleHomes[personIndex] - placeIndex) %% nPlaces
    distanceB = (placeIndex - peopleHomes[personIndex]) %% nPlaces
    distance = min(distanceA, distanceB)
    weights[placeIndex] = ifelse(distance == 0, placePopularity, placePopularity / distance)
  }
  return(weights / sum(weights))
}

isActiveInfected = function(personIndex) {
  return(
    infected[personIndex] &
    (t - infectedTime[personIndex] <= activeTime)
  )
}

isExposed = function(personIndex, exposedPlaces) {
  return(
    !infected[personIndex] &
    !peopleAtHome[personIndex] &
    peopleLocations[personIndex] %in% exposedPlaces
  )
}

addLayer = function() {
  exposureNetwork = add.vertices(exposureNetwork, nPlaces)
  nVertices = vcount(exposureNetwork)
  for (p in 1:nPlaces) {
    v = nVertices - nPlaces + p
    exposureNetwork = set_vertex_attr(exposureNetwork, 't', index=v, t)
    exposureNetwork = set_vertex_attr(exposureNetwork, 'place', index=v, p)
  }
  return(exposureNetwork)
}

getVertexIndex = function(location, t) {
  return((t - 1) * nPlaces + location)
}

logMovement = function(personIndex, currentMoveTime, previousLocation, previousMoveTime) {
  currentLocation = peopleLocations[personIndex]
  fromIndex = getVertexIndex(previousLocation, previousMoveTime)
  toIndex = getVertexIndex(currentLocation, currentMoveTime)
  exposureNetwork = add_edges(exposureNetwork, c(fromIndex, toIndex))
  return(exposureNetwork)
}

logExposeEvents = function(exposedPlaces) {
  newEvents = c()
  uniqueExposedPlaces = unique(exposedPlaces)
  for (p in 1:nPlaces) {
    newEvents = append(newEvents, p %in% uniqueExposedPlaces)
  }
  return(newEvents)
}

updateInfectionKnowledge = function(personIndex, t) {
  # person may discover their infection with some probability
  if (!infectionKnowledge[personIndex]) {
    infectionKnowledge[personIndex] = booleanProb(probDiscoverInfection)
  }
  return(infectionKnowledge)
}

flagInfection = function(personIndex, t) {
  # person assumes they have had infection for some time
  for (u in max(t - assumedTimeFromInfect, 1):t) {
    flaggedLocation = locationHistory[u, personIndex]
    flaggedExposeEvents = append(flaggedExposeEvents, getVertexIndex(flaggedLocation, u))
  }
  return(flaggedExposeEvents[!is.na(flaggedExposeEvents)])
}

# ------------------------------------------------------- #
#### Model ####
# ------------------------------------------------------- #

trialResults = c()
for (q in 1:nTrials) {
  # infection model
  infectedStart = length(infected[infected])
  placePopularities = rbeta(nPlaces, 2, 2)
  peopleHomes = floor(runif(nPeople, min=0, max=nPlaces))
  peopleLocations = floor(runif(nPeople, min=1, max=nPlaces))
  locationHistory = matrix(nrow=totalTime, ncol=nPeople)
  lastMovedTime = rep(1, nPeople)
  peopleAtHome = rep(NA, nPeople)
  infected = booleanProb(initialInfected, n=nPeople)
  infectedTime = ifelse(infected, 0, NA)
  exposeEvents = c()

  # intervention model
  # the exposure network is a "layered" directed graph; represents data maintanined in the app network
  # each layer in the graph is a point in time
  # each node in each layer is a place
  # edges point only forward in time, from one place to another (can also point to same place in next time frame)
  # the edges represent movement of people across time
  # edges are allowed to skip layers. This happens when people stay home for that time frame.
  exposureNetwork = graph.empty(n=0, directed=T)
  infectionKnowledge = rep(F, nPeople)
  # These may or may not be true expose events
  # This represents the information that is available in the network
  flaggedExposeEvents = c()
  infectedMovements = c() # for visualization

  placeProbabilities = matrix(nrow=nPeople, ncol=nPlaces)
  for (personIndex in 1:nPeople) {
    placeProbabilities[personIndex,] = getPlaceProbabilities(personIndex)
  }

  for (t in 1:totalTime) {
    exposedPlaces = c()
    # add 1 vertex for each place for each layer; each layer represents a point in time
    exposureNetwork = addLayer()
    for (personIndex in 1:nPeople) {
      # update locations (simulate movement)
      peopleAtHome[personIndex] = updatePersonAtHome(personIndex, t)
      personMoved = !peopleAtHome[personIndex]
      previousLocation = NA
      if (t > 1 & personMoved) {
        previousLocation = peopleLocations[personIndex]
        previousMoveTime = lastMovedTime[personIndex]
        peopleLocations[personIndex] = updatePersonLocation(personIndex)
        lastMovedTime[personIndex] = t
        # update exposure network
        exposureNetwork = logMovement(personIndex, t, previousLocation, previousMoveTime)
        infectedMovements = append(infectedMovements, isActiveInfected(personIndex))
      }
      locationHistory[t,personIndex] = ifelse(personMoved, peopleLocations[personIndex], NA)
      if (!peopleAtHome[personIndex] & isActiveInfected(personIndex)) {
        # if person is infected and active and not at home, they have exposed everyone at this location/point in time
        exposedPlaces = append(exposedPlaces, peopleLocations[personIndex])
        infectionKnowledge = updateInfectionKnowledge(personIndex, t)
        if (infectionKnowledge[personIndex]) {
          flaggedExposeEvents = flagInfection(personIndex, t)
        }
      }
    }
    for (personIndex in 1:nPeople) {
      if (isExposed(personIndex, exposedPlaces)) {
        # if person is in same time/place, they are exposed
        # probalistic infection
        infected[personIndex] = sample(booleanProb(infectionProb))
        if (infected[personIndex]) {
          # if infected, set time of infection
          infectedTime[personIndex] = t
        }
      }
    }
    exposeEvents = append(exposeEvents, logExposeEvents(exposedPlaces))
    if (nTrials == 1) {
      activeInfected = sapply(1:nPeople, function(i) { isActiveInfected(i) })
      print(paste('t:', t, ', # active:', length(activeInfected[activeInfected])))
      print(paste('t:', t, ', # infected:', length(infected[infected])))
      print(paste('t:', t, ', # at home:', length(peopleAtHome[peopleAtHome])))
    }
  }
  activeInfected = sapply(1:nPeople, function(i) { isActiveInfected(i) })
  trialResults = append(trialResults, length(infected[infected]) / nPeople)
}
# print(infectedStart)
print(paste(mean(trialResults), round(sd(trialResults) * 100) / 100, sep=' +- '))

if (genPlot) {
  eventColors = ifelse(
    exposeEvents,
    '#e37d7d',
    '#86bdfc'
  )
  edgeColors = ifelse(
    infectedMovements,
    '#cf1111',
    '#076adb'
  )
  plot(
    exposureNetwork,
    layout=function(g) { return(layout_on_grid(g, width=nPlaces)) },
    vertex.color=eventColors, #86bdfc
    vertex.size=rep(sqrt(placePopularities * 100) * 2, totalTime),
    edge.width=0.5,
    edge.color=edgeColors,
    label.font=2
  )
}
