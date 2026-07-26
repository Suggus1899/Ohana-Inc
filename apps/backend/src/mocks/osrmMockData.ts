export const osrmMockData = {
  walking_route: {
    code: 'Ok',
    routes: [
      {
        geometry: {
          type: 'LineString',
          coordinates: [
            [-67.3592, 9.4111],
            [-67.3585, 9.4105],
            [-67.3578, 9.4098],
            [-67.3570, 9.4092]
          ]
        },
        legs: [
          {
            steps: [
              {
                distance: 100,
                duration: 60,
                name: 'Calle Principal',
                maneuver: {
                  type: 'depart',
                  location: [-67.3592, 9.4111]
                }
              },
              {
                distance: 200,
                duration: 120,
                name: 'Avenida Bolívar',
                maneuver: {
                  type: 'turn',
                  modifier: 'right',
                  location: [-67.3585, 9.4105]
                }
              },
              {
                distance: 0,
                duration: 0,
                name: 'Destino',
                maneuver: {
                  type: 'arrive',
                  location: [-67.3570, 9.4092]
                }
              }
            ],
            distance: 300,
            duration: 180,
            summary: 'Calle Principal, Avenida Bolívar'
          }
        ],
        distance: 300,
        duration: 180
      }
    ],
    waypoints: [
      {
        name: 'Origen',
        location: [-67.3592, 9.4111]
      },
      {
        name: 'Destino',
        location: [-67.3570, 9.4092]
      }
    ]
  }
};
