# ------------------------------------------------------- #
#### Config ####
# ------------------------------------------------------- #

nPlaces = 5
nPeople = 20
totalTime = 4
initialInfected = 0.2
activeTime = 2
# probability of being infected when exposed
infectionProb = 0.4
probAwayMin = 0.7
probAwayMax = 0.9
nTrials = 1

# ------------------------------------------------------- #
#### Libraries ####
# ------------------------------------------------------- #

library(igraph)

# ------------------------------------------------------- #
#### Methods ####
# ------------------------------------------------------- #


booleanProb = function(probTrue, n=1) {
  sample(c(T,F), n, replace=T, c(probTrue, 1 - probTrue))
}

updatePersonAtHome = function(personIndex) {
  probAway = extroversions[personIndex]
  return(booleanProb(1 - probAway, 1))
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
    !peopleAtHome[personIndex] &
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

# ------------------------------------------------------- #
#### Model ####
# ------------------------------------------------------- #

trialResults = c()
for (q in 1:nTrials) {
  # infection model
  infectedStart = length(infected[infected])
  placePopularities = rbeta(nPlaces, 2, 2)
  peopleHomes = floor(runif(nPeople, min=0, max=nPlaces))
  extroversions = runif(nPeople, min=probAwayMin, max=probAwayMax)
  peopleLocations = floor(runif(nPeople, min=1, max=nPlaces))
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
      peopleAtHome[personIndex] = updatePersonAtHome(personIndex)
      personMoved = !peopleAtHome[personIndex]
      previousLocation = NA
      if (t > 1 & personMoved) {
        previousLocation = peopleLocations[personIndex]
        previousMoveTime = lastMovedTime[personIndex]
        peopleLocations[personIndex] = updatePersonLocation(personIndex)
        lastMovedTime[personIndex] = t
        # update exposure network
        exposureNetwork = logMovement(personIndex, t, previousLocation, previousMoveTime)
      }
      if (isActiveInfected(personIndex)) {
        # if person is infected and active, they have exposed everyone at this location at the same time
        exposedPlaces = append(exposedPlaces, peopleLocations[personIndex])
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
      activeInfected = isActiveInfected(infected)
      print(paste('t:', t, ', # infected:', length(activeInfected[activeInfected])))
    }
  }
  trialResults = append(trialResults, length(infected[infected]))
}
# print(infectedStart)
print(paste(mean(trialResults), round(sd(trialResults) * 100) / 100, sep=' +- '))

eventColors = ifelse(
  exposeEvents,
  'red',
  '#86bdfc'
)
plot(
  exposureNetwork,
  layout=function(g) { return(layout_on_grid(g, width=nPlaces)) },
  vertex.color=eventColors, #86bdfc
  vertex.size=rep(sqrt(placePopularities * 100) * 3, totalTime),
  edge.width=0.5,
  edge.color="#076adb"
)
