nPlaces = 5
nPeople = 19
totalTime = 50
initialInfected = 0.2
activeTime = 2
# probability of being infected when exposed
infectionProb = 0.25
probAwayMin = 0.7
probAwayMax = 0.9
nTrials = 100

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

trialResults = c()
for (q in 1:nTrials) {
  infectedStart = length(infected[infected])
  placePopularities = rbeta(nPlaces, 2, 2)
  peopleHomes = floor(runif(nPeople, min=0, max=nPlaces))
  extroversions = runif(nPeople, min=probAwayMin, max=probAwayMax)
  peopleLocations = floor(runif(nPeople, min=0, max=nPlaces))
  peopleAtHome = rep(NA, nPeople)
  infected = booleanProb(initialInfected, n=nPeople)
  infectedTime = ifelse(infected, 0, NA)

  placeProbabilities = matrix(nrow=nPeople, ncol=nPlaces)
  for (personIndex in 1:nPeople) {
    placeProbabilities[personIndex,] = getPlaceProbabilities(personIndex)
  }

  for (t in 1:totalTime) {
    exposedPlaces = c()
    for (personIndex in 1:nPeople) {
      # update locations (simulate movement)
      peopleAtHome[personIndex] = updatePersonAtHome(personIndex)
      peopleLocations[personIndex] = updatePersonLocation(personIndex)
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
    # print(infected)
  }
  trialResults = append(trialResults, length(infected[infected]))
}
# print(infectedStart)
print(paste(mean(trialResults), round(sd(trialResults) * 100) / 100, sep=' +- '))